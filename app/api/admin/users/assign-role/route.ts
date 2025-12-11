// app/api/admin/users/assign-role/route.ts
import Profiles, { type Role } from "@/app/models/Profiles";
import { requirePermission } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/mongoose";
import redis from "@/lib/redis";
import { NextResponse } from "next/server";

const VALID_ROLES: Role[] = ["user", "editor", "publisher", "admin"];

const ROLE_HIERARCHY: Record<Role, number> = {
    user: 1,
    editor: 2,
    publisher: 3,
    admin: 4,
};

// Audit log helper
async function logRoleChange(data: {
    admin_id: string;
    admin_name: string;
    target_id: string;
    target_name: string;
    old_roles: Role[];
    new_roles: Role[];
    timestamp: Date;
}) {
    try {
        const logKey = `audit:role_change:${Date.now()}`;
        await redis.set(logKey, JSON.stringify(data), { EX: 7776000 }); // 90 days
        console.log(
            `[AUDIT] Roles changed: ${data.target_name} from [${data.old_roles.join(", ")}] to [${data.new_roles.join(", ")}] by ${data.admin_name}`
        );
    } catch (error) {
        console.error("[ERROR] Failed to log role change:", error);
    }
}

export async function POST(req: Request) {
    try {
        // 1. Permission Check - Only admins can assign roles
        const { error, profile } = await requirePermission("manage_users");
        if (error) return error;

        await dbConnect();

        // 2. Parse Request Body
        const body = await req.json();
        const { userId, roles } = body;

        // 3. Validate Input
        if (!userId || !roles || !Array.isArray(roles)) {
            return NextResponse.json(
                { message: "User ID and roles array are required" },
                { status: 400 }
            );
        }

        // Validate each role
        for (const role of roles) {
            if (!VALID_ROLES.includes(role as Role)) {
                return NextResponse.json(
                    { message: `Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(", ")}` },
                    { status: 400 }
                );
            }
        }

        // 4. Prevent Self-Demotion (Admin cannot remove their own admin role)
        if (userId === profile._id.toString() && !roles.includes("admin")) {
            return NextResponse.json(
                { message: "You cannot remove your own admin role. Ask another admin." },
                { status: 403 }
            );
        }

        // 5. Role Hierarchy Check
        const assignerMaxLevel = Math.max(...profile.roles.map(r => ROLE_HIERARCHY[r]));
        const targetMaxLevel = Math.max(...roles.map((r: Role) => ROLE_HIERARCHY[r]));

        if (targetMaxLevel >= assignerMaxLevel && !profile.roles.includes("admin")) {
            return NextResponse.json(
                { message: "You cannot assign roles equal to or higher than your own" },
                { status: 403 }
            );
        }

        // 6. Find Target User
        const targetUser = await Profiles.findById(userId);

        if (!targetUser) {
            return NextResponse.json(
                { message: "User not found in the system" },
                { status: 404 }
            );
        }

        // 7. Update Roles
        const oldRoles = [...targetUser.roles];
        targetUser.roles = roles as Role[];
        await targetUser.save();

        // 8. Audit Log
        await logRoleChange({
            admin_id: profile._id.toString(),
            admin_name: profile.name,
            target_id: userId,
            target_name: targetUser.name,
            old_roles: oldRoles,
            new_roles: roles,
            timestamp: new Date(),
        });

        // 9. Invalidate User's Sessions (Force Re-login)
        const sessionKeys = await redis.keys(`session:jti:*`);
        for (const key of sessionKeys) {
            const storedId = await redis.get(key);
            if (storedId === userId) {
                const jti = key.split(":")[2];
                await redis.set(`token:blacklist:${jti}`, "1", { EX: 3600 });
                await redis.del(key);
            }
        }

        console.log(
            `[INFO] Roles updated: ${targetUser.name} (${userId}) -> [${roles.join(", ")}] by ${profile.name}`
        );

        return NextResponse.json(
            {
                message: `Roles successfully updated`,
                user: {
                    userId: targetUser._id.toString(),
                    name: targetUser.name,
                    email: targetUser.email,
                    roles: targetUser.roles,
                    is_active: targetUser.is_active,
                },
                requires_relogin: true,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[ERROR] Assign role error:", error);
        return NextResponse.json(
            { message: "Failed to assign roles. Please try again." },
            { status: 500 }
        );
    }
}

// GET - Get current editors/admins list
export async function GET(req: Request) {
    try {
        const { error } = await requirePermission("manage_users");
        if (error) return error;

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const roleFilter = searchParams.get("role");

        // Build query
        const query: any = { is_active: true };
        
        if (roleFilter && VALID_ROLES.includes(roleFilter as Role)) {
            query.roles = roleFilter;
        } else {
            // Default: Show privileged users (editors and above)
            query.roles = { $in: ["editor", "publisher", "admin"] };
        }

        // Fetch users
        const users = await Profiles.find(query)
            .select("name email roles google_picture profile_picture_url last_login createdAt")
            .sort({ roles: -1, name: 1 })
            .limit(100)
            .lean();

        const enriched = users.map((user: any) => ({
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            roles: user.roles,
            profile_picture_url: user.profile_picture_url || user.google_picture || null,
            last_login: user.last_login || null,
            created_at: user.createdAt,
        }));

        return NextResponse.json(
            {
                users: enriched,
                count: enriched.length,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[ERROR] Get editors list error:", error);
        return NextResponse.json(
            { message: "Failed to fetch users" },
            { status: 500 }
        );
    }
}