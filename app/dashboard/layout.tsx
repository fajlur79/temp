"use client";

import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar user={user} logout={logout} />
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}