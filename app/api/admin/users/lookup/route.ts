// app/api/admin/users/lookup/route.ts
import Profiles from "@/app/models/Profiles";
import RegisteredUsers from "@/app/models/RegisteredUser";
import { requirePermission } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/mongoose";
import redis from "@/lib/redis";
import { NextResponse } from "next/server";

// Rate limiting helper
async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:user_lookup:${identifier}`;
    const limit = 50; // 50 searches per hour
    const window = 3600; // 1 hour

    const current = await redis.incr(key);
    if (current === 1) {
        await redis.expire(key, window);
    }

    return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
    };
}

// Audit log helper
async function logAdminSearch(adminId: string, searchQuery: string, resultFound: boolean) {
    try {
        const logKey = `audit:user_search:${Date.now()}`;
        await redis.set(
            logKey,
            JSON.stringify({
                admin_id: adminId,
                search_query: searchQuery,
                result_found: resultFound,
                timestamp: new Date().toISOString(),
            }),
            { EX: 2592000 } // Keep for 30 days
        );

        console.log(`[AUDIT] Admin ${adminId.substring(0, 3)}*** searched for: ${searchQuery} - Found: ${resultFound}`);
    } catch (error) {
        console.error("[ERROR] Failed to log admin search:", error);
        // Don't fail the request if logging fails
    }
}

// GET - Search/lookup user by ID number or name
export async function GET(req: Request) {
    try {
        const { error, profile } = await requirePermission("manage_users");
        if (error) return error;

        // Ensure DB connection is established
        try {
            await dbConnect();
        } catch (dbError) {
            console.error("[ERROR] Database connection failed:", dbError);
            return NextResponse.json(
                { message: "Database connection failed. Please try again." },
                { status: 503 }
            );
        }

        // Rate limiting check
        const rateLimit = await checkRateLimit(profile.id_number);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "Too many search requests. Please try again later.", remaining: 0 },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("id") || searchParams.get("q") || searchParams.get("query");

        if (!query || typeof query !== "string" || query.trim().length === 0) {
            return NextResponse.json({ message: "Search query is required" }, { status: 400 });
        }

        const sanitizedQuery = query.trim();

        // Minimum 2 characters for search
        if (sanitizedQuery.length < 2) {
            return NextResponse.json({ message: "Search query must be at least 2 characters" }, { status: 400 });
        }

        // Build search conditions (case-insensitive)
        const searchConditions = {
            $or: [
                { id_number: { $regex: sanitizedQuery, $options: "i" } },
                { name: { $regex: sanitizedQuery, $options: "i" } },
            ],
        };

        // Search in RegisteredUsers first (all pre-approved users)
        // Add explicit timeout and error handling
        let registeredUsers;
        try {
            registeredUsers = await RegisteredUsers.find(searchConditions)
                .limit(10)
                .maxTimeMS(5000) // 5 second query timeout
                .lean()
                .exec();
        } catch (queryError) {
            console.error("[ERROR] RegisteredUsers query failed:", queryError);
            return NextResponse.json(
                { message: "Search query failed. Please try again." },
                { status: 500 }
            );
        }

        if (registeredUsers.length === 0) {
            // Log search with no results
            await logAdminSearch(profile.id_number, sanitizedQuery, false);

            return NextResponse.json(
                { 
                    message: "No users found",
                    users: [],
                    count: 0,
                    remaining_searches: rateLimit.remaining - 1
                },
                { status: 200 }
            );
        }

        // For each registered user, check if they have a profile
        const results = await Promise.all(
            registeredUsers.map(async (regUser) => {
                try {
                    const userProfile = await Profiles.findOne({ id_number: regUser.id_number })
                        .select("-password")
                        .maxTimeMS(5000)
                        .lean()
                        .exec();

                    return {
                        id_number: userProfile?.id_number || regUser.id_number,
                        name: userProfile?.name || regUser.name,
                        email: userProfile?.email || regUser.email,
                        role: userProfile?.role || regUser.role || "student",
                        profile_picture_url: userProfile?.profile_picture_url || null,
                        created_at: userProfile?.created_at || regUser.createdAt,
                        last_login: userProfile?.last_login || null,
                        is_signed_up: regUser.is_signed_up || false,
                    };
                } catch (profileError) {
                    console.error(`[ERROR] Profile lookup failed for ${regUser.id_number}:`, profileError);
                    // Return registered user data even if profile lookup fails
                    return {
                        id_number: regUser.id_number,
                        name: regUser.name,
                        email: regUser.email,
                        role: regUser.role || "student",
                        profile_picture_url: null,
                        created_at: regUser.createdAt,
                        last_login: null,
                        is_signed_up: regUser.is_signed_up || false,
                    };
                }
            })
        );

        // Log successful search
        await logAdminSearch(profile.id_number, sanitizedQuery, true);

        return NextResponse.json(
            {
                users: results,
                count: results.length,
                remaining_searches: rateLimit.remaining - 1,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[ERROR] User lookup error:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}