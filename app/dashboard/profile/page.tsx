"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Loader2,
    Camera,
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    Pencil,
    Check,
    X,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface UserProfile {
    name: string;
    email: string;
    bio?: string;
    profile_picture_url?: string;
    google_picture?: string;
    social_links?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
    };
}

export default function ProfilePage() {
    const { checkAuth } = useAuth();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
    const [social, setSocial] = useState({
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
    });

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load profile on mount
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/user/profile", { credentials: "include" });
                const data = await res.json();
                const u = data.user;

                const processed: UserProfile = {
                    name: u.name,
                    email: u.email,
                    bio: u.bio || "",
                    profile_picture_url: u.profile_picture_url,
                    google_picture: u.google_picture,
                    social_links: u.social_links || {},
                };

                setProfile(processed);
                setInitialProfile(JSON.parse(JSON.stringify(processed)));

                setSocial({
                    facebook: u.social_links?.facebook || "",
                    instagram: u.social_links?.instagram || "",
                    twitter: u.social_links?.twitter || "",
                    linkedin: u.social_links?.linkedin || "",
                });
            } catch {
                toast.error("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const avatar =
        profile?.profile_picture_url ||
        profile?.google_picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || "U")}`;

    const handleSave = async () => {
        if (!profile) return;

        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profile.name,
                    bio: profile.bio,
                    social_links: social,
                }),
            });

            if (!res.ok) throw new Error();
            toast.success("Profile updated.");

            setInitialProfile(JSON.parse(JSON.stringify(profile)));
            setEditing(false);
            await checkAuth();
        } catch {
            toast.error("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (!initialProfile) return;
        setProfile(JSON.parse(JSON.stringify(initialProfile)));
        
        setEditing(false);
    };

    if (loading || !profile) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold">My Profile</h1>
                    <p className="text-muted-foreground mt-1">
                        View and update your personal details.
                    </p>
                </div>

                {!editing ? (
                    <Button variant="outline" onClick={() => setEditing(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Check className="w-4 h-4 mr-1" /> Save
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                            <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                    </div>
                )}
            </div>

            {/* Layout: Avatar Card + Edit Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* LEFT: Avatar & Email */}
                <Card className="h-fit sticky top-24">
                    <CardHeader>
                        <CardTitle>Profile Summary</CardTitle>
                        <CardDescription>Basic account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="flex flex-col items-center gap-4">

                            <div className="relative group">
                                <img
                                    src={avatar}
                                    className="w-28 h-28 rounded-full object-cover border shadow-sm"
                                />
                                {editing && (
                                    <button
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                        onClick={() => toast.info("Avatar upload coming soon")}
                                    >
                                        <Camera className="w-6 h-6 text-white" />
                                    </button>
                                )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Recommended 400×400 JPG or PNG
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input disabled value={profile.email} className="bg-muted text-muted-foreground" />
                        </div>

                    </CardContent>
                </Card>

                {/* RIGHT: Editable Fields */}
                <div className="md:col-span-2 space-y-8">

                    {/* Personal Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                This is displayed to your readers.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    disabled={!editing}
                                    value={profile.name}
                                    onChange={(e) =>
                                        setProfile((prev) => prev && { ...prev, name: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Bio</Label>
                                <Textarea
                                    disabled={!editing}
                                    value={profile.bio}
                                    onChange={(e) =>
                                        setProfile((prev) => prev && { ...prev, bio: e.target.value })
                                    }
                                    className="min-h-[120px]"
                                    placeholder="Tell readers about yourself..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Social Links */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Connections</CardTitle>
                            <CardDescription>
                                Optional links to your public profiles
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="grid md:grid-cols-2 gap-4">
                            {[
                                { key: "facebook", label: "Facebook", icon: Facebook },
                                { key: "instagram", label: "Instagram", icon: Instagram },
                                { key: "twitter", label: "Twitter / X", icon: Twitter },
                                { key: "linkedin", label: "LinkedIn", icon: Linkedin },
                            ].map(({ key, label, icon: Icon }) => (
                                <div className="space-y-2" key={key}>
                                    <Label className="flex items-center gap-2">
                                        <Icon size={14} /> {label}
                                    </Label>
                                    <Input
                                        disabled={!editing}
                                        value={(social as any)[key]}
                                        onChange={(e) =>
                                            setSocial((prev) => ({ ...prev, [key]: e.target.value }))
                                        }
                                        placeholder={`https://${key}.com/username`}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
