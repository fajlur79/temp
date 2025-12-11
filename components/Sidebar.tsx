// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Home, 
    FileText, 
    PenTool, 
    Settings, 
    LogOut, 
    User,
    ClipboardList,
    Upload,
    Users,
    Shield,
    BookOpen,
    Crown,
    Briefcase
} from "lucide-react";
import type { Role } from "@/app/models/Profiles";

interface SidebarProps {
    user: {
        userId: string;
        name: string;
        email: string;
        roles: Role[];
        profile_picture_url?: string | null;
    };
    logout: () => void;
}

interface NavItem {
    href: string;
    label: string;
    icon: any;
    requiredRoles?: Role[];
}

export default function Sidebar({ user, logout }: SidebarProps) {
    const pathname = usePathname();

    // Check if user has any of the required roles
    const hasAccess = (requiredRoles?: Role[]) => {
        if (!requiredRoles || requiredRoles.length === 0) return true;
        if (user.roles.includes("admin")) return true;
        return requiredRoles.some(role => user.roles.includes(role));
    };

    // Get primary role for display
    const getPrimaryRole = () => {
        const hierarchy: Record<Role, number> = {
            admin: 4,
            publisher: 3,
            editor: 2,
            user: 1,
        };
        
        const sorted = [...user.roles].sort((a, b) => hierarchy[b] - hierarchy[a]);
        return sorted[0] || "user";
    };

    // Role badge color
    const getRoleBadgeColor = () => {
        const primaryRole = getPrimaryRole();
        const colors: Record<Role, string> = {
            admin: "bg-red-100 text-red-700",
            publisher: "bg-orange-100 text-orange-700",
            editor: "bg-purple-100 text-purple-700",
            user: "bg-slate-100 text-slate-700",
        };
        return colors[primaryRole];
    };

    const navItems: NavItem[] = [
        // Base items (all users)
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/contribute", label: "Contribute", icon: PenTool },
        { href: "/dashboard/submission", label: "My Submissions", icon: FileText },
        
        // Editor items
        { 
            href: "/dashboard/editor/pending", 
            label: "Review Queue", 
            icon: ClipboardList,
            requiredRoles: ["editor", "publisher"]
        },
        
        // Publisher items
        { 
            href: "/dashboard/editor/finalize", 
            label: "Publish Magazine", 
            icon: Upload,
            requiredRoles: ["publisher"]
        },
        
        // Admin items
        { 
            href: "/dashboard/admin/users", 
            label: "User Management", 
            icon: Users,
            requiredRoles: ["admin"]
        },
        { 
            href: "/dashboard/admin/security", 
            label: "Security", 
            icon: Shield,
            requiredRoles: ["admin"]
        },
    ];

    const filteredNavItems = navItems.filter(item => hasAccess(item.requiredRoles));

    const bottomItems: NavItem[] = [
        { href: "/dashboard/profile", label: "Profile", icon: User },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-slate-200">
                <Link href="/" className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900">Apodartho</h1>
                        <p className="text-xs text-slate-500">Wall Magazine</p>
                    </div>
                </Link>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                        {user.profile_picture_url ? (
                            <img src={user.profile_picture_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-slate-600 font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{user.name}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor()}`}>
                            {getPrimaryRole() === "admin" && <Crown className="w-3 h-3" />}
                            {getPrimaryRole() === "publisher" && <Briefcase className="w-3 h-3" />}
                            {getPrimaryRole()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-1">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                        isActive
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Navigation */}
            <div className="p-4 border-t border-slate-200 space-y-1">
                {bottomItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    );
                })}
                
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}