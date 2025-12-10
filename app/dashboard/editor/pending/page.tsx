"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ProtectedRoute } from "@/contexts/AuthContext";
import { Calendar, FileText, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

const fetcher = async (url: string) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function EditorPendingPage() {
    return (
        <ProtectedRoute allowedRoles={["editor", "admin", "publisher"]}>
            <EditorPendingContent />
        </ProtectedRoute>
    );
}

function EditorPendingContent() {
    const [status, setStatus] = useState("PENDING_REVIEW");
    const [category, setCategory] = useState("all");
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    // Build API URL with filters
    const apiUrl = `/api/posts/editor/pending?status=${status}&category=${category}&page=${page}&limit=10`;

    const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
        revalidateOnFocus: false,
    });

    // Filter posts by search query on frontend (optional)
    const filteredPosts = data?.posts?.filter((post: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            post.title.toLowerCase().includes(query) ||
            post.author_name.toLowerCase().includes(query)
        );
    }) || [];

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        setPage(1); // Reset to first page
    };

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Review Submissions</h1>
                <p className="text-muted-foreground mt-1">
                    Review and manage pending article submissions
                </p>
            </div>

            {/* Stats Cards */}
            {data?.stats && (
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Review
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.stats.pending_review}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Accepted
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{data.stats.accepted}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Designing
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{data.stats.designing}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Awaiting Admin
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{data.stats.awaiting_admin}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Admin Rejected
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{data.stats.admin_rejected}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title or author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                <SelectItem value="DESIGNING">Designing</SelectItem>
                                <SelectItem value="AWAITING_ADMIN">Awaiting Admin</SelectItem>
                                <SelectItem value="ADMIN_REJECTED">Admin Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Category Filter */}
                        <Select value={category} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="article">Articles</SelectItem>
                                <SelectItem value="poem">Poems</SelectItem>
                                <SelectItem value="artwork">Artwork</SelectItem>
                                <SelectItem value="notice">Notices</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Posts List */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Submissions ({data?.pagination.total || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-destructive font-medium mb-2">Failed to load submissions</p>
                            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                            <Button onClick={() => mutate()} variant="outline" size="sm">
                                <Loader2 className="mr-2 h-4 w-4" />
                                Retry
                            </Button>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery ? "No submissions match your search" : "No submissions found"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredPosts.map((post: any) => (
                                <Link
                                    key={post._id}
                                    href={`/dashboard/editor/${post._id}`}
                                    className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold truncate">{post.title}</h3>
                                                <Badge variant="outline" className="capitalize shrink-0">
                                                    {post.category}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <span>By {post.author_name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(post.created_at).toLocaleDateString()}
                                                </div>
                                                <Badge
                                                    variant={
                                                        post.status === "PENDING_REVIEW"
                                                            ? "default"
                                                            : post.status === "ACCEPTED"
                                                            ? "secondary"
                                                            : "outline"
                                                    }
                                                    className="capitalize"
                                                >
                                                    {post.status.replace("_", " ")}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {data.pagination.page} of {data.pagination.pages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!data.pagination.hasMore}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}