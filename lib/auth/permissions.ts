// lib/auth/permissions.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import redis from "@/lib/redis";
import Profiles, { type Role, type ProfileDocument } from "@/app/models/Profiles";
import { dbConnect } from "@/lib/mongoose";

// Permission types
export type Permission = 
    | "create_post"
    | "view_own_posts"
    | "view_pending_submissions"
    | "accept_reject_submissions"
    | "upload_designed_version"
    | "approve_designs"
    | "publish_post"
    | "delete_post"
    | "manage_users"
    | "assign_editors"
    | "view_security_logs"
    | "download_original_files";

// Permission to Roles mapping
const PERMISSIONS: Record<Permission, Role[]> = {
    // User permissions (everyone)
    "create_post": ["user", "editor", "publisher", "admin"],
    "view_own_posts": ["user", "editor", "publisher", "admin"],
    
    // Editor permissions
    "view_pending_submissions": ["editor", "publisher", "admin"],
    "accept_reject_submissions": ["editor", "publisher", "admin"],
    "upload_designed_version": ["editor", "publisher", "admin"],
    "approve_designs": ["editor", "publisher", "admin"],
    
    // Publisher permissions
    "publish_post": ["publisher", "admin"],
    
    // Admin permissions
    "delete_post": ["admin"],
    "manage_users": ["admin"],
    "assign_editors": ["admin"],
    "view_security_logs": ["admin"],
    "download_original_files": ["editor", "publisher", "admin"],
};

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<Role, number> = {
    user: 1,
    editor: 2,
    publisher: 3,
    admin: 4,
};

// JWT Payload Interface
interface JWTPayload {
    userId: string;  // MongoDB _id as string
    email: string;
    roles: Role[];
    type: string;
    jti?: string;
    iat?: number;
    exp?: number;
}

// Check if user has a specific permission
export function hasPermission(userRoles: Role[], permission: Permission): boolean {
    // Admin has all permissions
    if (userRoles.includes("admin")) return true;
    
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles.some(role => userRoles.includes(role));
}

// Check if user has ANY of the permissions
export function hasAnyPermission(userRoles: Role[], permissions: Permission[]): boolean {
    if (userRoles.includes("admin")) return true;
    return permissions.some(permission => hasPermission(userRoles, permission));
}

// Check if user has ALL of the permissions
export function hasAllPermissions(userRoles: Role[], permissions: Permission[]): boolean {
    if (userRoles.includes("admin")) return true;
    return permissions.every(permission => hasPermission(userRoles, permission));
}

// Check if user has a specific role
export function hasRole(userRoles: Role[], role: Role): boolean {
    if (userRoles.includes("admin")) return true;
    return userRoles.includes(role);
}

// Check if user has ANY of the roles
export function hasAnyRole(userRoles: Role[], roles: Role[]): boolean {
    if (userRoles.includes("admin")) return true;
    return roles.some(role => userRoles.includes(role));
}

// Check if user has ALL of the roles
export function hasAllRoles(userRoles: Role[], roles: Role[]): boolean {
    if (userRoles.includes("admin")) return true;
    return roles.every(role => userRoles.includes(role));
}

// Get highest role (for display)
export function getPrimaryRole(roles: Role[]): Role {
    const sorted = [...roles].sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]);
    return sorted[0] || "user";
}

// Check if role A can manage role B
export function canManageRole(assignerRoles: Role[], targetRole: Role): boolean {
    if (assignerRoles.includes("admin")) return true;
    
    const assignerLevel = Math.max(...assignerRoles.map(r => ROLE_HIERARCHY[r]));
    const targetLevel = ROLE_HIERARCHY[targetRole];
    
    return assignerLevel > targetLevel;
}

// Get authenticated user from JWT
export async function getAuthenticatedUser(): Promise<{
    user: JWTPayload | null;
    profile: ProfileDocument | null;
    error: NextResponse | null;
}> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token")?.value;

        if (!token) {
            return {
                user: null,
                profile: null,
                error: NextResponse.json({ message: "Not authenticated" }, { status: 401 }),
            };
        }

        // Verify JWT
        let decoded: JWTPayload;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        } catch (err) {
            cookieStore.delete("session_token");
            return {
                user: null,
                profile: null,
                error: NextResponse.json({ message: "Invalid session" }, { status: 401 }),
            };
        }

        // Check if token is blacklisted
        if (decoded.jti) {
            const blacklisted = await redis.get(`token:blacklist:${decoded.jti}`);
            if (blacklisted === "1") {
                cookieStore.delete("session_token");
                return {
                    user: null,
                    profile: null,
                    error: NextResponse.json({ message: "Session revoked" }, { status: 401 }),
                };
            }
        }

        // Get profile from database
        await dbConnect();
        const profile = await Profiles.findById(decoded.userId);

        if (!profile || !profile.is_active) {
            return {
                user: null,
                profile: null,
                error: NextResponse.json({ message: "User not found or inactive" }, { status: 404 }),
            };
        }

        return {
            user: decoded,
            profile: profile as ProfileDocument,
            error: null,
        };
    } catch (error) {
        console.error("[ERROR] Auth error:", error);
        return {
            user: null,
            profile: null,
            error: NextResponse.json({ message: "Authentication failed" }, { status: 500 }),
        };
    }
}

// Require authentication
export async function requireAuth() {
    return getAuthenticatedUser();
}

// Require specific permission
export async function requirePermission(permission: Permission) {
    const { user, profile, error } = await getAuthenticatedUser();

    if (error) return { error, user: null, profile: null };
    if (!user || !profile) {
        return {
            error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
            user: null,
            profile: null,
        };
    }

    if (!hasPermission(profile.roles, permission)) {
        return {
            error: NextResponse.json({ message: "Insufficient permissions" }, { status: 403 }),
            user,
            profile: null,
        };
    }

    return { error: null, user, profile };
}

// Require any of the permissions
export async function requireAnyPermission(permissions: Permission[]) {
    const { user, profile, error } = await getAuthenticatedUser();

    if (error) return { error, user: null, profile: null };
    if (!user || !profile) {
        return {
            error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
            user: null,
            profile: null,
        };
    }

    if (!hasAnyPermission(profile.roles, permissions)) {
        return {
            error: NextResponse.json({ message: "Insufficient permissions" }, { status: 403 }),
            user,
            profile: null,
        };
    }

    return { error: null, user, profile };
}

// Require specific role
export async function requireRole(role: Role) {
    const { user, profile, error } = await getAuthenticatedUser();

    if (error) return { error, user: null, profile: null };
    if (!user || !profile) {
        return {
            error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
            user: null,
            profile: null,
        };
    }

    if (!hasRole(profile.roles, role)) {
        return {
            error: NextResponse.json({ message: "Insufficient role" }, { status: 403 }),
            user,
            profile: null,
        };
    }

    return { error: null, user, profile };
}

// Require any of the roles
export async function requireAnyRole(roles: Role[]) {
    const { user, profile, error } = await getAuthenticatedUser();

    if (error) return { error, user: null, profile: null };
    if (!user || !profile) {
        return {
            error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
            user: null,
            profile: null,
        };
    }

    if (!hasAnyRole(profile.roles, roles)) {
        return {
            error: NextResponse.json({ message: "Insufficient role" }, { status: 403 }),
            user,
            profile: null,
        };
    }

    return { error: null, user, profile };
}

// Get authenticated profile (shorthand)
export async function getAuthenticatedProfile() {
    const { user, profile } = await getAuthenticatedUser();
    return { user, profile };
}