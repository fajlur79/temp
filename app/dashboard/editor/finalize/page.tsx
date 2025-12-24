// app/dashboard/editor/finalize/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/contexts/AuthContext";
import { FileIcon, Loader2, Upload, Eye, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = async (url: string) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function FinalizePage() {
    return (
        <ProtectedRoute allowedRoles={["editor", "admin", "publisher"]}>
            <FinalizeContent />
        </ProtectedRoute>
    );
}

function FinalizeContent() {
    const [file, setFile] = useState<File | null>(null);
    const [editionTitle, setEditionTitle] = useState("");
    const [description, setDescription] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch existing editions
    const { data, mutate, isLoading, error: fetchError } = useSWR("/api/magazine/upload", fetcher, {
        onError: (err) => {
            console.error("Fetch error:", err);
            toast.error("Failed to load editions");
        }
    });

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !editionTitle) {
            toast.error("Please provide a title and select a file");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", editionTitle);
            if (description) formData.append("description", description);
            if (academicYear) formData.append("academic_year", academicYear);

            console.log("Uploading to /api/magazine/upload...");
            
            const res = await fetch("/api/magazine/upload", {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            console.log("Response status:", res.status);
            console.log("Response headers:", Object.fromEntries(res.headers.entries()));

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Non-JSON response:", text.substring(0, 500));
                throw new Error("Server returned an invalid response. Check console for details.");
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || data.error || "Upload failed");
            }

            toast.success("Magazine edition uploaded successfully and sent for review!");
            setFile(null);
            setEditionTitle("");
            setDescription("");
            setAcademicYear("");
            mutate(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || "Failed to upload magazine");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string, isCurrent: boolean) => {
        if (status === "PUBLISHED" || isCurrent) {
            return <Badge className="bg-green-100 text-green-800 border-green-300">Published</Badge>;
        }
        if (status === "REJECTED") {
            return <Badge variant="destructive">Rejected</Badge>;
        }
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Awaiting Approval</Badge>;
    };

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Publish Magazine Edition</h1>
                <p className="text-muted-foreground">
                    Upload the compiled PDF version. Publishers and Admins will review before publishing.
                </p>
            </div>

            {/* Upload Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload New Edition</CardTitle>
                    <CardDescription>
                        This will be sent to publishers/admins for approval before going live.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Edition Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Spring Edition 2025"
                                value={editionTitle}
                                onChange={(e) => setEditionTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="academic_year">Academic Year (Optional)</Label>
                            <Input
                                id="academic_year"
                                placeholder="e.g., 2024-2025"
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of this edition..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Magazine PDF File *</Label>
                            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-slate-50 transition-colors bg-white">
                                <input
                                    type="file"
                                    id="mag-file"
                                    className="hidden"
                                    accept="application/pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required
                                />
                                <label htmlFor="mag-file" className="cursor-pointer block">
                                    <div className="flex flex-col items-center gap-2">
                                        {file ? (
                                            <>
                                                <FileIcon className="w-10 h-10 text-blue-600" />
                                                <p className="font-medium text-slate-900">{file.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-10 h-10 text-slate-400" />
                                                <p className="font-medium text-slate-600">Click to select PDF</p>
                                                <p className="text-xs text-slate-400">PDF only, max 50MB</p>
                                            </>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading || !file}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading & Sending for Review...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Submit for Review
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Previous Editions */}
            <Card>
                <CardHeader>
                    <CardTitle>Previous Editions</CardTitle>
                    <CardDescription>View status of your uploaded editions</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    ) : !data?.editions || data.editions.length === 0 ? (
                        <div className="text-center py-12">
                            <FileIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-600 mb-2">No editions uploaded yet</p>
                            <p className="text-sm text-slate-500">
                                Upload your first magazine edition above
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.editions.map((edition: any) => (
                                <div
                                    key={edition.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-medium text-slate-900">{edition.title}</h4>
                                            {getStatusBadge(edition.status, edition.is_current)}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>
                                                Uploaded {new Date(edition.published_at).toLocaleDateString()}
                                            </span>
                                            {edition.academic_year && <span>{edition.academic_year}</span>}
                                            {edition.file_size && (
                                                <span>{(edition.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                            )}
                                        </div>
                                        {edition.rejection_reason && (
                                            <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                                <strong>Rejection Reason:</strong> {edition.rejection_reason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild size="sm" variant="outline">
                                            <a
                                                href={edition.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </a>
                                        </Button>
                                        <Button asChild size="sm" variant="outline">
                                            <a href={edition.pdf_url} download>
                                                <Download className="w-4 h-4 mr-1" />
                                                Download
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}