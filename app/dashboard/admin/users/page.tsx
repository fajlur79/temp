"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
    Search, 
    Shield, 
    UserCog, 
    CheckCircle2, 
    AlertTriangle, 
    Loader2, 
    UserPlus
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Define Role Types based on your permissions.ts
type Role = "student" | "professor" | "editor" | "admin" | "publisher";

const ROLES: { value: Role; label: string; description: string; color: string }[] = [
    { value: "student", label: "Student", description: "Standard access to view and submit content.", color: "bg-slate-100 text-slate-700" },
    { value: "professor", label: "Professor", description: "Can verify student submissions and submit own work.", color: "bg-blue-100 text-blue-700" },
    { value: "editor", label: "Editor", description: "Can review, edit, and approve submissions.", color: "bg-purple-100 text-purple-700" },
    { value: "publisher", label: "Publisher", description: "Final authority to publish content to the live site.", color: "bg-orange-100 text-orange-700" },
    { value: "admin", label: "Administrator", description: "Full system access, user management, and logs.", color: "bg-red-100 text-red-700" },
];

export default function AdminUsersPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage system access, roles, and user registrations.
                </p>
            </div>

            <Tabs defaultValue="manage-roles" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="manage-roles">Assign Roles</TabsTrigger>
                    <TabsTrigger value="directory">User Directory</TabsTrigger>
                </TabsList>

                {/* --- TAB: ASSIGN ROLES --- */}
                <TabsContent value="manage-roles" className="mt-6">
                    <AssignRoleTab />
                </TabsContent>

                {/* --- TAB: DIRECTORY (Placeholder for existing list) --- */}
                <TabsContent value="directory" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Directory</CardTitle>
                            <CardDescription>View all registered users in the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                                <UserCog className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="font-semibold text-lg">User List Component</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mt-2">
                                    This tab would contain your data table of all users with sorting and filtering.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// --- SUB-COMPONENT: ASSIGN ROLE LOGIC ---
function AssignRoleTab() {
    const [searchId, setSearchId] = useState("");
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | "">("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // 1. Find User Function
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId.trim()) return;

        setLoading(true);
        setUserData(null);
        setSelectedRole("");

        try {
            // Note: You might need to create this specific endpoint or use a filter param on your users list API
            // For now, assuming direct lookup by ID is possible
            const res = await fetch(`/api/admin/users/lookup?id=${searchId}`);
            
            if (res.ok) {
                const data = await res.json();
                setUserData(data.user);
            } else {
                toast.error("User not found");
            }
        } catch (error) {
            toast.error("Failed to search for user");
        } finally {
            setLoading(false);
        }
    };

    // 2. Assign Role Function
    const handleAssignRole = async () => {
        if (!userData || !selectedRole) return;

        setIsUpdating(true);
        try {
            const res = await fetch("/api/admin/users/assign-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_number: userData.id_number,
                    role: selectedRole
                }),
            });

            if (!res.ok) throw new Error("Failed to update role");

            toast.success(`Role updated to ${ROLES.find(r => r.value === selectedRole)?.label}`);
            
            // Refresh local data
            setUserData({ ...userData, role: selectedRole });
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("Failed to update user role");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2 items-start">
            {/* LEFT COL: Search & Select */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-primary" /> 
                            Lookup User
                        </CardTitle>
                        <CardDescription>
                            Enter a College ID Number to find the user.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input 
                                placeholder="e.g. 123-1111-2222-33" 
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                className="font-mono"
                            />
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : "Find"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Only show role selection if user is found */}
                {userData && (
                    <Card className="border-primary/20 bg-primary/5 animate-in slide-in-from-top-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Select New Role
                            </CardTitle>
                            <CardDescription>
                                Choose the access level for this user.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select 
                                value={selectedRole} 
                                onValueChange={(val: any) => setSelectedRole(val)}
                            >
                                <SelectTrigger className="w-full bg-background">
                                    <SelectValue placeholder="Select a role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            <div className="flex flex-col items-start py-1">
                                                <span className="font-medium">{role.label}</span>
                                                <span className="text-xs text-muted-foreground">{role.description}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Confirmation Dialog Trigger */}
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button 
                                        className="w-full" 
                                        disabled={!selectedRole || selectedRole === userData.role}
                                    >
                                        Assign Role
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                                            <AlertTriangle className="h-5 w-5" />
                                            Confirm Privilege Change
                                        </DialogTitle>
                                        <DialogDescription className="pt-2">
                                            Are you sure you want to change <strong>{userData.name}</strong>'s role from 
                                            <span className="font-mono mx-1 px-1 rounded bg-slate-100">{userData.role}</span> 
                                            to 
                                            <span className="font-mono mx-1 px-1 rounded bg-primary/10 text-primary font-bold">
                                                {selectedRole}
                                            </span>?
                                        </DialogDescription>
                                    </DialogHeader>

                                    {selectedRole === 'admin' && (
                                        <div className="p-3 bg-red-50 text-red-800 text-sm rounded-md border border-red-100 flex gap-2">
                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <p>This user will have full access to the system, including deleting data and managing other admins.</p>
                                        </div>
                                    )}

                                    <DialogFooter className="mt-4">
                                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleAssignRole} disabled={isUpdating}>
                                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirm Change
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* RIGHT COL: User Details Preview */}
            <div className="space-y-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>User Profile</CardTitle>
                        <CardDescription>
                            Current status and details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {userData ? (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="h-24 w-24 rounded-full bg-slate-200 border-4 border-white shadow-sm flex items-center justify-center text-3xl font-bold text-slate-500 overflow-hidden">
                                        {userData.profile_picture_url ? (
                                            <img src={userData.profile_picture_url} alt={userData.name} className="h-full w-full object-cover" />
                                        ) : (
                                            userData.name.charAt(0)
                                        )}
                                    </div>
                                    <h3 className="mt-4 text-xl font-bold text-slate-900">{userData.name}</h3>
                                    <p className="text-sm text-slate-500">{userData.email}</p>
                                    
                                    <div className="mt-4 flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono">
                                            {userData.id_number}
                                        </Badge>
                                        <Badge className={
                                            ROLES.find(r => r.value === userData.role)?.color || "bg-slate-100"
                                        }>
                                            {userData.role}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                                    
                                    <Separator />
                                    
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-sm text-blue-700">
                                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                                        <div>
                                            <p className="font-semibold">Active Account</p>
                                            <p className="text-blue-600/80">User has no restrictions.</p>
                                        </div>
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
        </div>
    );
}