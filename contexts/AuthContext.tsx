"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/app/models/Profiles";

// User type
export interface User {
    userId: string;  // MongoDB _id
    name: string;
    email: string;
    roles: Role[];
    profile_picture_url?: string | null;
    bio?: string;
}

// Auth context type
interface AuthContextType {
    user: User | null;
    loading: boolean;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
    hasRole: (role: Role) => boolean;
    hasAnyRole: (roles: Role[]) => boolean;
    hasAllRoles: (roles: Role[]) => boolean;
    getPrimaryRole: () => Role;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await fetch("/api/user/profile", {
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                setUser({
                    userId: data.user._id || data.user.userId,
                    name: data.user.name,
                    email: data.user.email,
                    roles: data.user.roles || ["user"],
                    profile_picture_url: data.user.profile_picture_url,
                    bio: data.user.bio,
                });
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setUser(null);
            window.location.href = "/";
        }
    };

    const hasRole = (role: Role): boolean => {
        if (!user) return false;
        if (user.roles.includes("admin")) return true;
        return user.roles.includes(role);
    };

    const hasAnyRole = (roles: Role[]): boolean => {
        if (!user) return false;
        if (user.roles.includes("admin")) return true;
        return roles.some(role => user.roles.includes(role));
    };

    const hasAllRoles = (roles: Role[]): boolean => {
        if (!user) return false;
        if (user.roles.includes("admin")) return true;
        return roles.every(role => user.roles.includes(role));
    };

    const getPrimaryRole = (): Role => {
        if (!user || user.roles.length === 0) return "user";
        
        const hierarchy: Record<Role, number> = {
            admin: 4,
            publisher: 3,
            editor: 2,
            user: 1,
        };
        
        const sorted = [...user.roles].sort((a, b) => hierarchy[b] - hierarchy[a]);
        return sorted[0];
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                checkAuth,
                logout,
                hasRole,
                hasAnyRole,
                hasAllRoles,
                getPrimaryRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Protected Route Component
export function ProtectedRoute({
    children,
    allowedRoles,
}: {
    children: ReactNode;
    allowedRoles?: Role[];
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/auth/login");
            } else if (allowedRoles && allowedRoles.length > 0) {
                // Check if user has ANY of the allowed roles
                const hasAccess = allowedRoles.some(role => 
                    user.roles.includes("admin") || user.roles.includes(role)
                );
                
                if (!hasAccess) {
                    router.push("/unauthorized");
                }
            }
        }
    }, [user, loading, allowedRoles, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!user) return null;

    if (allowedRoles && allowedRoles.length > 0) {
        const hasAccess = allowedRoles.some(role => 
            user.roles.includes("admin") || user.roles.includes(role)
        );
        
        if (!hasAccess) return null;
    }

    return <>{children}</>;
}