"use client";

import { 
    LayoutDashboard, 
    FileText, 
    Upload, 
    Shield, 
    Users, 
    Settings, 
    LogOut, 
    FileCheck,
    BookOpen,
    BarChart3,
    UserCircle,
    Sliders
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Sidebar({ user, logout }: { user: any, logout: () => void }) {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href;

    return (
        <aside className="hidden md:flex flex-col w-64 border-r bg-card h-[calc(100vh-4rem)] sticky top-16">
            <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
                
                {/* User Snippet (Clickable to go to Profile) */}
                <Link href="/dashboard/profile" className="flex items-center gap-3 px-2 py-2 hover:bg-muted/50 rounded-lg transition-colors group">
                    <Avatar className="h-10 w-10 border ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={user.profile_picture_url} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{user.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                    </div>
                </Link>

                {/* --- MAIN NAVIGATION (No Label) --- */}
                <nav className="space-y-1">
                    <NavItem 
                        href="/dashboard" 
                        icon={LayoutDashboard} 
                        label="Overview" 
                        active={isActive("/dashboard")} 
                    />
                    
                    <NavItem 
                        href="/dashboard/profile" 
                        icon={UserCircle} 
                        label="Profile" 
                        active={isActive("/dashboard/profile")} 
                    />
                    
                    <NavItem 
                        href="/dashboard/settings" 
                        icon={Sliders} 
                        label="Settings" 
                        active={isActive("/dashboard/settings")} 
                    />

                    <div className="my-2 border-t border-border/50 mx-2" />

                    <NavItem 
                        href="/dashboard/submission" 
                        icon={FileText} 
                        label="My Submissions" 
                        active={isActive("/dashboard/submission")} 
                    />
                    
                    {(user.role === "student" || user.role === "professor") && (
                        <NavItem 
                            href="/contribute" 
                            icon={Upload} 
                            label="New Submission" 
                            active={isActive("/contribute")} 
                        />
                    )}
                </nav>

                {/* --- EDITOR SECTION (Roles: editor, publisher, admin) --- */}
                {["editor", "publisher", "admin"].includes(user.role) && (
                    <div className="space-y-1">
                        <SectionLabel>Editor Panel</SectionLabel>
                        <NavItem 
                            href="/dashboard/editor/pending" 
                            icon={FileCheck} 
                            label="Pending Reviews" 
                            active={isActive("/dashboard/editor/pending")} 
                        />
                        <NavItem 
                            href="/dashboard/posts" 
                            icon={BookOpen} 
                            label="All Magazine Posts" 
                            active={isActive("/dashboard/posts")} 
                        />
                    </div>
                )}

                {/* --- ADMIN SECTION (Roles: admin) --- */}
                {user.role === "admin" && (
                    <div className="space-y-1">
                        <SectionLabel>Admin Panel</SectionLabel>
                        <NavItem 
                            href="/admin/users" 
                            icon={Users} 
                            label="User Management" 
                            active={isActive("/admin/users")} 
                        />
                        <NavItem 
                            href="/admin/security" 
                            icon={Shield} 
                            label="Security Logs" 
                            active={isActive("/admin/security")} 
                        />
                        <NavItem 
                            href="/admin/analytics" 
                            icon={BarChart3} 
                            label="Analytics" 
                            active={isActive("/admin/analytics")} 
                        />
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-muted/20">
                <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
                    onClick={logout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}

// Helper Components for cleaner code
function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                active 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <Icon size={18} strokeWidth={2} />
            {label}
        </Link>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="px-3 pt-4 pb-2 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">
            {children}
        </p>
    );
}