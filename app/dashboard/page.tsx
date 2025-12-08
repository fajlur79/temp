"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useAuth();

    // In a real app, you would fetch these stats from an API
    const stats = [
        { title: "Total Submissions", value: "12", icon: FileText, color: "text-blue-500" },
        { title: "Pending Review", value: "3", icon: Clock, color: "text-amber-500" },
        { title: "Published", value: "8", icon: CheckCircle, color: "text-emerald-500" },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {user?.name}. Here's what's happening today.
                    </p>
                </div>
                {user?.role !== "admin" && (
                     <Button asChild>
                        <Link href="/contribute">
                            <Sparkles className="mr-2 h-4 w-4" />
                            New Contribution
                        </Link>
                     </Button>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                +2 from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Role Specific Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                
                {/* Main Activity Feed - Takes up 4 columns */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {/* Mock Activity Items */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            Article "Quantum Physics 101" submitted
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {i} hours ago
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-muted-foreground">
                                        Pending
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / Notifications - Takes up 3 columns */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="p-4 bg-muted/50 rounded-lg text-sm">
                            <span className="font-semibold text-primary">Editor's Note:</span> Please update your profile picture for the upcoming magazine edition.
                         </div>
                         <Button variant="outline" className="w-full justify-between group">
                            Go to Profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                         </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}