// lib/auth/middleware.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import redis from "@/lib/redis";
import Profiles, { type Role, type ProfileDocument } from "@/app/models/Profiles";
import { dbConnect } from "@/lib/mongoose";

// JWT Payload Interface
export interface AuthUser {
    userId: string;  // MongoDB _id as string
    email: string;
    roles: Role[];
    type: string;
    jti?: string;
    iat?: number;
    exp?: number;
}

// Authentication result
export interface AuthResult {
    user: AuthUser | null;
    profile: ProfileDocument | null;
    error: NextResponse | null;
}

// Main authentication middleware
export async function requireAuth(): Promise<AuthResult> {
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
        let decoded: AuthUser;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
        } catch (err) {
            cookieStore.delete("session_token");
            return {
                user: null,
                profile: null,
                error: NextResponse.json({ message: "Invalid or expired session" }, { status: 401 }),
            };
        }

        // Validate token type
        if (decoded.type !== "authenticated_session") {
            return {
                user: null,
                profile: null,
                error: NextResponse.json({ message: "Invalid token type" }, { status: 401 }),
            };
        }

        // Check if token is blacklisted
        if (decoded.jti) {
            const blacklisted = await redis.get(`token:blacklist:${decoded.jti}`);
            
            // Hard blacklist check
            if (blacklisted === "1") {
                cookieStore.delete("session_token");
                return {
                    user: null,
                    profile: null,
                    error: NextResponse.json({ message: "Session has been revoked" }, { status: 401 }),
                };
            }

            // Grace period check (during token rotation)
            const inGracePeriod = await redis.get(`token:grace:${decoded.jti}`);
            if (!inGracePeriod && blacklisted === "rotating") {
                // Grace period expired
                cookieStore.delete("session_token");
                return {
                    user: null,
                    profile: null,
                    error: NextResponse.json({ message: "Session expired, please refresh" }, { status: 401 }),
                };
            }
        }

        // Get profile from database
        await dbConnect();
        const profile = await Profiles.findById(decoded.userId).lean();

        if (!profile) {
            return {
                user: null,
                profile: null,
                error: NextResponse.json({ message: "User not found" }, { status: 404 }),
            };
        }

        // Check if user is active
        if (!profile.is_active) {
            return {
                user: null,
                profile: null,
                error: NextResponse.json({ message: "Account has been deactivated" }, { status: 403 }),
            };
        }

        // Sync roles from database (in case they changed)
        decoded.roles = profile.roles;

        return {
            user: decoded,
            profile: profile as ProfileDocument,
            error: null,
        };
    } catch (error) {
        console.error("[ERROR] Auth middleware error:", error);
        return {
            user: null,
            profile: null,
            error: NextResponse.json({ message: "Authentication failed" }, { status: 500 }),
        };
    }
}

// Check if user has specific role
export function userHasRole(user: AuthUser | null, role: Role): boolean {
    if (!user) return false;
    if (user.roles.includes("admin")) return true;
    return user.roles.includes(role);
}

// Check if user has any of the roles
export function userHasAnyRole(user: AuthUser | null, roles: Role[]): boolean {
    if (!user) return false;
    if (user.roles.includes("admin")) return true;
    return roles.some(role => user.roles.includes(role));
}

// Check if user has all of the roles
export function userHasAllRoles(user: AuthUser | null, roles: Role[]): boolean {
    if (!user) return false;
    if (user.roles.includes("admin")) return true;
    return roles.every(role => user.roles.includes(role));
}

// Get user's primary role (highest in hierarchy)
export function getUserPrimaryRole(user: AuthUser | null): Role {
    if (!user || user.roles.length === 0) return "user";
    
    const hierarchy: Record<Role, number> = {
        admin: 4,
        publisher: 3,
        editor: 2,
        user: 1,
    };
    
    const sorted = [...user.roles].sort((a, b) => hierarchy[b] - hierarchy[a]);
    return sorted[0];
}

// Create session token
export function createSessionToken(profile: ProfileDocument): string {
    const jti = crypto.randomUUID();
    
    const payload: AuthUser = {
        userId: profile._id.toString(),
        email: profile.email,
        roles: profile.roles,
        type: "authenticated_session",
        jti,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: "7d",
    });

    // Store session JTI in Redis
    redis.set(`session:jti:${jti}`, profile._id.toString(), {
        EX: 7 * 24 * 60 * 60, // 7 days
    }).catch(err => console.error("[ERROR] Failed to store session JTI:", err));

    return token;
}

// Revoke session
export async function revokeSession(jti: string, expiresIn: number = 3600): Promise<void> {
    try {
        await redis.set(`token:blacklist:${jti}`, "1", { EX: expiresIn });
        await redis.del(`session:jti:${jti}`);
    } catch (error) {
        console.error("[ERROR] Failed to revoke session:", error);
    }
}

// Revoke all user sessions
export async function revokeAllUserSessions(userId: string): Promise<void> {
    try {
        const sessionKeys = await redis.keys(`session:jti:*`);
        
        for (const key of sessionKeys) {
            const storedUserId = await redis.get(key);
            if (storedUserId === userId) {
                const jti = key.split(":")[2];
                await revokeSession(jti);
            }
        }
    } catch (error) {
        console.error("[ERROR] Failed to revoke all user sessions:", error);
    }
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("session_token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("session_token");
}

// Update last login timestamp
export async function updateLastLogin(userId: string): Promise<void> {
    try {
        await dbConnect();
        await Profiles.findByIdAndUpdate(userId, {
            last_login: new Date(),
        });
    } catch (error) {
        console.error("[ERROR] Failed to update last login:", error);
    }
}