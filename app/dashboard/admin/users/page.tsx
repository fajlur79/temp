// app/dashboard/admin/users/page.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
    Search,
    Shield,
    UserCog,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Crown,
    Star,
    Users,
    Briefcase,
    Plus,
    X,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type Role = "user" | "editor" | "publisher" | "admin";

const ROLES: { value: Role; label: string; description: string; color: string; icon: any }[] = [
    {
        value: "user",
        label: "User",
        description: "Can submit content and view published posts",
        color: "bg-slate-100 text-slate-700",
        icon: Users,
    },
    {
        value: "editor",
        label: "Editor",
        description: "Can review, design, and approve submissions",
        color: "bg-purple-100 text-purple-700",
        icon: UserCog,
    },
    {
        value: "publisher",
        label: "Publisher",
        description: "Can publish content to live site",
        color: "bg-orange-100 text-orange-700",
        icon: Briefcase,
    },
    {
        value: "admin",
        label: "Administrator",
        description: "Full system access and user management",
        color: "bg-red-100 text-red-700",
        icon: Crown,
    },
];

const fetcher = async (url: string) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function AdminUsersPage() {
    const [activeTab, setActiveTab] = useState("staff");

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage system access and assign roles.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="staff">Staff Members</TabsTrigger>
                    <TabsTrigger value="assign">Assign Roles</TabsTrigger>
                </TabsList>

                <TabsContent value="staff" className="mt-6">
                    <StaffListTab />
                </TabsContent>

                <TabsContent value="assign" className="mt-6">
                    <AssignRoleTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StaffListTab() {
    const { data, isLoading } = useSWR("/api/admin/users/assign-role", fetcher);

    const groupedByRole = (data?.users || []).reduce((acc: any, user: any) => {
        const roles = Array.isArray(user.roles)?user.roles : [];
        roles.forEach((role: Role) => {
            if (!acc[role]) acc[role] = [];
            if (!acc[role].find((u: any) => u.userId === user.userId)) {
                acc[role].push(user);
            }
        });
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        Staff Members
                    </CardTitle>
                    <CardDescription>Users with elevated privileges in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : data?.users?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <UserCog className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No staff members assigned yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {["admin", "publisher", "editor"].map((roleKey) => {
                                const users = groupedByRole[roleKey] || [];
                                if (users.length === 0) return null;

                                const roleInfo = ROLES.find((r) => r.value === roleKey);
                                const Icon = roleInfo?.icon || UserCog;

                                return (
                                    <div key={roleKey}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Icon className="w-4 h-4 text-muted-foreground" />
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                                {roleInfo?.label}s ({users.length})
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            {users.map((user: any) => (
                                                <div
                                                    key={user.userId}
                                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={user.profile_picture_url} />
                                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                                {user.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{user.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {user.roles.map((role: Role) => {
                                                            const r = ROLES.find((x) => x.value === role);
                                                            return (
                                                                <Badge key={role} className={r?.color}>
                                                                    {r?.label}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function AssignRoleTab() {
    const [searchId, setSearchId] = useState("");
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId.trim()) return;

        setLoading(true);
        setUserData(null);
        setSelectedRoles([]);

        try {
            const res = await fetch(`/api/admin/users/lookup?id=${encodeURIComponent(searchId)}`);

            if (res.ok) {
                const data = await res.json();
                if (data.users && data.users.length > 0) {
                    const user = data.users[0];
                    setUserData(user);
                    setSelectedRoles(user.roles || ["user"]);
                } else {
                    toast.error("User not found");
                }
            } else {
                toast.error("User not found");
            }
        } catch (error) {
            toast.error("Failed to search for user");
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = (role: Role) => {
        if (role === "admin") {
            // Admin is exclusive
            setSelectedRoles(["admin"]);
        } else {
            if (selectedRoles.includes("admin")) {
                // Remove admin, add this role
                setSelectedRoles([role]);
            } else {
                if (selectedRoles.includes(role)) {
                    // Remove role, ensure at least "user" remains
                    const newRoles = selectedRoles.filter((r) => r !== role);
                    setSelectedRoles(newRoles.length === 0 ? ["user"] : newRoles);
                } else {
                    // Add role
                    setSelectedRoles([...selectedRoles, role]);
                }
            }
        }
    };

    const handleAssignRole = async () => {
        if (!userData || selectedRoles.length === 0) return;

        setIsUpdating(true);
        try {
            const res = await fetch("/api/admin/users/assign-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userData.userId,
                    roles: selectedRoles,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to update roles");
            }

            const result = await res.json();

            toast.success(`Roles updated successfully`);

            if (result.requires_relogin) {
                toast.info("User will need to log in again to see new permissions", {
                    duration: 5000,
                });
            }

            setUserData({ ...userData, roles: selectedRoles });
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update user roles");
        } finally {
            setIsUpdating(false);
        }
    };

    const hasChanged = () => {
        if (!userData) return false;
        if (selectedRoles.length !== userData.roles.length) return true;
        return !selectedRoles.every((r) => userData.roles.includes(r));
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2 items-start">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-primary" />
                            Lookup User
                        </CardTitle>
                        <CardDescription>Search by name or email to find a user.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                            />
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : "Find"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {userData && (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Select Roles
                            </CardTitle>
                            <CardDescription>Users can have multiple roles (except admin).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {ROLES.map((role) => {
                                    const Icon = role.icon;
                                    const isSelected = selectedRoles.includes(role.value);
                                    const isAdmin = role.value === "admin";
                                    const hasAdmin = selectedRoles.includes("admin");

                                    return (
                                        <div
                                            key={role.value}
                                            className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                                isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                                            } ${hasAdmin && !isAdmin ? "opacity-50" : ""}`}
                                            onClick={() => toggleRole(role.value)}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                disabled={hasAdmin && !isAdmin}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon className="w-4 h-4" />
                                                    <span className="font-medium">{role.label}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{role.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full" disabled={!hasChanged()}>
                                        Update Roles
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                                            <AlertTriangle className="h-5 w-5" />
                                            Confirm Role Changes
                                        </DialogTitle>
                                        <DialogDescription className="pt-2">
                                            Are you sure you want to change <strong>{userData.name}</strong>'s roles?
                                            <div className="mt-3 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs">From:</span>
                                                    <div className="flex gap-1">
                                                        {userData.roles.map((r: Role) => (
                                                            <Badge key={r} variant="outline" className="text-xs">
                                                                {r}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs">To:</span>
                                                    <div className="flex gap-1">
                                                        {selectedRoles.map((r: Role) => (
                                                            <Badge key={r} className="text-xs">
                                                                {r}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogDescription>
                                    </DialogHeader>

                                    {selectedRoles.includes("admin") && (
                                        <div className="p-3 bg-red-50 text-red-800 text-sm rounded-md border border-red-100 flex gap-2">
                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <p>This user will have full access to the system.</p>
                                        </div>
                                    )}

                                    <DialogFooter className="mt-4">
                                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAssignRole} disabled={isUpdating}>
                                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirm
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card className="h-full">
                <CardHeader>
                    <CardTitle>User Profile</CardTitle>
                    <CardDescription>Current status and details.</CardDescription>
                </CardHeader>
                <CardContent>
                    {userData ? (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                                    <AvatarImage src={userData.profile_picture_url} />
                                    <AvatarFallback className="text-3xl font-bold bg-slate-200">
                                        {userData.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <h3 className="mt-4 text-xl font-bold">{userData.name}</h3>
                                <p className="text-sm text-muted-foreground">{userData.email}</p>

                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                    {userData.roles.map((role: Role) => {
                                        const r = ROLES.find((x) => x.value === role);
                                        return (
                                            <Badge key={role} className={r?.color}>
                                                {r?.label}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Account Created</p>
                                    <p className="font-medium">
                                        {new Date(userData.created_at || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Last Login</p>
                                    <p className="font-medium">
                                        {userData.last_login
                                            ? new Date(userData.last_login).toLocaleDateString()
                                            : "Never"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                            <Search className="h-12 w-12 mb-4 opacity-20" />
                            <p>Search for a user to view their details</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}