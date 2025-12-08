"use client";

import { Camera, Facebook, Instagram, Linkedin, Loader2, Sparkles, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext"; // Assuming you have this
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Match the Interface to your DB Schema
interface UserProfile {
    name: string;
    role: string;
    email: string;
    avatar: string;
    bio: string;
    social_links: {
        facebook?: string;
        instagram?: string;
        twitter?: string; // Replaced Youtube with Twitter/Linkedin to match DB
        linkedin?: string;
    };
}

export default function ProfilePage() {
    const { user: authUser, checkAuth } = useAuth(); // Get base user from context
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);
    
    // Local state for the form
    const [formData, setFormData] = useState<UserProfile>({
        name: "",
        role: "",
        email: "",
        avatar: "",
        bio: "",
        social_links: {
            facebook: "",
            instagram: "",
            twitter: "",
            linkedin: "",
        },
    });

    // 1. Fetch Data on Mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (!res.ok) throw new Error("Failed to fetch profile");
                
                const data = await res.json();
                const u = data.user;

                setFormData({
                    name: u.name || "",
                    role: u.role || "",
                    email: u.email || "",
                    avatar: u.profile_picture_url || "",
                    bio: u.bio || "",
                    social_links: {
                        facebook: u.social_links?.facebook || "",
                        instagram: u.social_links?.instagram || "",
                        twitter: u.social_links?.twitter || "",
                        linkedin: u.social_links?.linkedin || "",
                    },
                });
            } catch (error) {
                toast.error("Could not load profile data");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // 2. Handle Save (PATCH request)
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    bio: formData.bio,
                    social_links: formData.social_links,
                }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            toast.success("Profile updated successfully");
            await checkAuth(); // Refresh global auth context
        } catch (error) {
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    // 3. AI Bio Generation (Keep existing logic but update state)
    const handleRewriteBio = async () => {
        if (isGeneratingBio) return;
        setIsGeneratingBio(true);
        try {
            const prompt = `Rewrite this bio to be professional for a Magazine contributor. Name: ${formData.name}, Role: ${formData.role}. Current Bio: "${formData.bio}". Return only the text.`;
            const response = await fetch("/api/ai-helper", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const data = await response.json();
            if (data.text) {
                setFormData(prev => ({ ...prev, bio: data.text.trim() }));
                toast.success("Bio generated!");
            }
        } catch (error) {
            toast.error("AI generation failed");
        } finally {
            setIsGeneratingBio(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
                    <p className="text-muted-foreground">Manage your public persona and info.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Main Info Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>This information will be displayed on your published articles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <img
                                    src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}`}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-muted shadow-sm"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="text-white w-6 h-6" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-medium">Profile Picture</h3>
                                <p className="text-xs text-muted-foreground">Click the image to upload a new one.</p>
                                <p className="text-xs text-muted-foreground">Max 2MB. JPG, PNG.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input 
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={formData.email} disabled className="bg-muted text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Input value={formData.role} disabled className="bg-muted text-muted-foreground capitalize" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Bio</Label>
                                <button
                                    onClick={handleRewriteBio}
                                    disabled={isGeneratingBio}
                                    className="text-xs flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
                                >
                                    <Sparkles size={12} />
                                    {isGeneratingBio ? "Writing..." : "Enhance with AI"}
                                </button>
                            </div>
                            <Textarea 
                                value={formData.bio} 
                                onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                                className="min-h-[100px]"
                                placeholder="Tell us about yourself..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Social Links Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Social Profiles</CardTitle>
                        <CardDescription>Connect your social media accounts.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Facebook size={14} /> Facebook</Label>
                            <Input 
                                placeholder="https://facebook.com/username"
                                value={formData.social_links.facebook}
                                onChange={e => setFormData({
                                    ...formData, 
                                    social_links: { ...formData.social_links, facebook: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Instagram size={14} /> Instagram</Label>
                            <Input 
                                placeholder="https://instagram.com/username"
                                value={formData.social_links.instagram}
                                onChange={e => setFormData({
                                    ...formData, 
                                    social_links: { ...formData.social_links, instagram: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Twitter size={14} /> Twitter / X</Label>
                            <Input 
                                placeholder="https://twitter.com/username"
                                value={formData.social_links.twitter}
                                onChange={e => setFormData({
                                    ...formData, 
                                    social_links: { ...formData.social_links, twitter: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Linkedin size={14} /> LinkedIn</Label>
                            <Input 
                                placeholder="https://linkedin.com/in/username"
                                value={formData.social_links.linkedin}
                                onChange={e => setFormData({
                                    ...formData, 
                                    social_links: { ...formData.social_links, linkedin: e.target.value }
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}