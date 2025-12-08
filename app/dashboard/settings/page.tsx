"use client";

import { useTheme } from "next-themes"; // Ensure you have next-themes installed
import { Moon, Sun, Laptop, Lock, Bell, Smartphone, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function SettingsPage() {
    const { setTheme, theme } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [emailDigest, setEmailDigest] = useState(false);

    const handlePasswordReset = async () => {
        // Logic to trigger password reset email
        toast.info("Password reset link sent to your email.");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account preferences and application settings.</p>
            </div>

            <div className="grid gap-6">
                
                {/* Appearance Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sun className="h-5 w-5" /> Appearance
                        </CardTitle>
                        <CardDescription>
                            Customize how the application looks on your device.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-3 gap-2 max-w-md">
                                <Button 
                                    variant={theme === 'light' ? 'default' : 'outline'} 
                                    className="justify-start" 
                                    onClick={() => setTheme("light")}
                                >
                                    <Sun className="mr-2 h-4 w-4" /> Light
                                </Button>
                                <Button 
                                    variant={theme === 'dark' ? 'default' : 'outline'} 
                                    className="justify-start" 
                                    onClick={() => setTheme("dark")}
                                >
                                    <Moon className="mr-2 h-4 w-4" /> Dark
                                </Button>
                                <Button 
                                    variant={theme === 'system' ? 'default' : 'outline'} 
                                    className="justify-start" 
                                    onClick={() => setTheme("system")}
                                >
                                    <Laptop className="mr-2 h-4 w-4" /> System
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" /> Notifications
                        </CardTitle>
                        <CardDescription>
                            Choose what you want to be notified about.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Submission Updates</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive emails when your article status changes.
                                </p>
                            </div>
                            <Switch checked={notifications} onCheckedChange={setNotifications} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Weekly Digest</Label>
                                <p className="text-sm text-muted-foreground">
                                    Get a weekly summary of top articles.
                                </p>
                            </div>
                            <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" /> Security
                        </CardTitle>
                        <CardDescription>
                            Manage your password and account access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Password</Label>
                                <p className="text-sm text-muted-foreground">
                                    Change your password regularly to keep your account secure.
                                </p>
                            </div>
                            <Button variant="outline" onClick={handlePasswordReset}>Change Password</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-destructive">Danger Zone</Label>
                                <p className="text-sm text-muted-foreground">
                                    Permanently delete your account and all data.
                                </p>
                            </div>
                            <Button variant="destructive">Delete Account</Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}