// app/api/admin/users/lookup/route.ts
import Profiles from "@/app/models/Profiles";
import { requirePermission } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/mongoose";
import redis from "@/lib/redis";
import { NextResponse } from "next/server";

// Rate limiting helper
async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:user_lookup:${identifier}`;
    const limit = 50;
    const window = 3600;

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
            { EX: 2592000 }
        );

        console.log(`[AUDIT] Admin ${adminId.substring(0, 3)}*** searched for: ${searchQuery} - Found: ${resultFound}`);
    } catch (error) {
        console.error("[ERROR] Failed to log admin search:", error);
    }
}

// GET - Search/lookup user by ID or name
export async function GET(req: Request) {
    try {
        const { error, profile } = await requirePermission("manage_users");
        if (error) return error;

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
        const rateLimit = await checkRateLimit(profile._id.toString());
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

        if (sanitizedQuery.length < 2) {
            return NextResponse.json({ message: "Search query must be at least 2 characters" }, { status: 400 });
        }

        // Build search conditions (case-insensitive)
        const searchConditions = {
            $or: [
                { name: { $regex: sanitizedQuery, $options: "i" } },
                { email: { $regex: sanitizedQuery, $options: "i" } },
            ],
            is_active: true,
        };

        let users;
        try {
            users = await Profiles.find(searchConditions)
                .select("name email roles google_picture profile_picture_url last_login createdAt")
                .limit(10)
                .maxTimeMS(5000)
                .lean()
                .exec();
        } catch (queryError) {
            console.error("[ERROR] Users query failed:", queryError);
            return NextResponse.json(
                { message: "Search query failed. Please try again." },
                { status: 500 }
            );
        }

        if (users.length === 0) {
            await logAdminSearch(profile._id.toString(), sanitizedQuery, false);

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

        const results = users.map((user: any) => ({
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            roles: user.roles,
            profile_picture_url: user.profile_picture_url || user.google_picture || null,
            created_at: user.createdAt,
            last_login: user.last_login || null,
        }));

        await logAdminSearch(profile._id.toString(), sanitizedQuery, true);

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