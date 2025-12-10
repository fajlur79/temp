"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/contexts/AuthContext";
import { Calendar, Edit3, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

const fetcher = async (url: string) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function SubmissionsPage() {
    return (
        <ProtectedRoute>
            <SubmissionsContent />
        </ProtectedRoute>
    );
}

function SubmissionsContent() {
    const [filter, setFilter] = useState("all");

    // Fetch user's posts
    const { data, error, isLoading } = useSWR("/api/posts/my-submissions", fetcher);

    // Filter posts by status
    const filtered = data?.posts
        ? filter === "all"
            ? data.posts
            : data.posts.filter((post: any) => {
                  if (filter === "published") return post.status === "PUBLISHED";
                  if (filter === "pending") return post.status === "PENDING_REVIEW";
                  if (filter === "approved") return ["ACCEPTED", "DESIGNING", "APPROVED"].includes(post.status);
                  return true;
              })
        : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">My Submissions</h2>
                    <p className="text-muted-foreground mt-1">
                        Track and manage your article submissions
                    </p>
                </div>
                <Button asChild>
                    <Link href="/contribute">
                        <FileText className="mr-2 h-4 w-4" />
                        New Submission
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            {data?.stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Submissions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Published
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{data.stats.published}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Review
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{data.stats.pending}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                In Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{data.stats.in_progress}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Submissions List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800">My Articles</h2>
                    <div className="flex gap-2">
                        {["all", "published", "pending", "approved"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                    filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center">
                            <p className="text-red-600 font-medium mb-2">Failed to load submissions</p>
                            <p className="text-sm text-muted-foreground">{error.message}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <p className="text-slate-600 mb-2">No submissions found</p>
                            <p className="text-sm text-slate-500 mb-4">
                                {filter === "all" 
                                    ? "Start by creating your first submission"
                                    : `No ${filter} submissions`}
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/contribute">Create Submission</Link>
                            </Button>
                        </div>
                    ) : (
                        filtered.map((sub: any) => (
                            <div key={sub._id} className="p-6 flex justify-between items-center hover:bg-slate-50">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-medium text-slate-900">{sub.title}</h4>
                                        <Badge
                                            variant="outline"
                                            className={`capitalize ${
                                                sub.status === "PUBLISHED"
                                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                    : sub.status === "PENDING_REVIEW"
                                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                                    : sub.status === "REJECTED"
                                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                                    : "bg-blue-100 text-blue-800 border-blue-300"
                                            }`}
                                        >
                                            {sub.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(sub.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="capitalize">{sub.category || "Uncategorized"}</span>
                                        {sub.views > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {sub.views} Views
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-indigo-600"
                                >
                                    <Link href={`/post/${sub._id}`}>
                                        <Edit3 size={18} />
                                    </Link>
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}