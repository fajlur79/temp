// app/dashboard/admin/magazine/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ProtectedRoute } from "@/contexts/AuthContext";
import {
    CheckCircle2,
    XCircle,
    Eye,
    Download,
    Loader2,
    FileText,
    AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const fetcher = async (url: string) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function MagazineReviewPage() {
    return (
        <ProtectedRoute allowedRoles={["publisher", "admin"]}>
            <MagazineReviewContent />
        </ProtectedRoute>
    );
}

function MagazineReviewContent() {
    const { data, mutate, isLoading } = useSWR("/api/magazine/upload?status=AWAITING_APPROVAL", fetcher);
    const [selectedEdition, setSelectedEdition] = useState<any | null>(null);
    const [action, setAction] = useState<"approve" | "reject" | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleReview = async () => {
        if (!selectedEdition || !action) return;

        if (action === "reject" && !rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        setProcessing(true);
        try {
            const body: any = { action };
            if (action === "reject") {
                body.rejection_reason = rejectionReason;
            }

            const res = await fetch(`/api/magazine/${selectedEdition.id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Review failed");
            }

            toast.success(
                action === "approve"
                    ? "Magazine published successfully!"
                    : "Magazine rejected and editor notified"
            );

            setSelectedEdition(null);
            setAction(null);
            setRejectionReason("");
            mutate(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || "Failed to process review");
        } finally {
            setProcessing(false);
        }
    };

    const openReviewDialog = (edition: any, reviewAction: "approve" | "reject") => {
        setSelectedEdition(edition);
        setAction(reviewAction);
        setRejectionReason("");
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Magazine Review</h1>
                <p className="text-muted-foreground">
                    Review and approve magazine editions submitted by editors
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Editions</CardTitle>
                    <CardDescription>
                        These editions are awaiting your approval before being published
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-32 w-full" />
                            ))}
                        </div>
                    ) : !data?.editions || data.editions.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-600 mb-2">No pending editions</p>
                            <p className="text-sm text-slate-500">
                                All magazine editions have been reviewed
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.editions.map((edition: any) => (
                                <Card key={edition.id} className="border-2">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-semibold">{edition.title}</h3>
                                                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                                        Awaiting Review
                                                    </Badge>
                                                </div>

                                                {edition.description && (
                                                    <p className="text-sm text-slate-600 mb-3">
                                                        {edition.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                                    <span>
                                                        Uploaded by {edition.published_by?.name || "Unknown"}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(edition.published_at).toLocaleDateString()}
                                                    </span>
                                                    {edition.academic_year && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{edition.academic_year}</span>
                                                        </>
                                                    )}
                                                    {edition.file_size && (
                                                        <>
                                                            <span>•</span>
                                                            <span>
                                                                {(edition.file_size / 1024 / 1024).toFixed(2)} MB
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button asChild size="sm" variant="outline">
                                                        <a
                                                            href={edition.pdf_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Preview PDF
                                                        </a>
                                                    </Button>
                                                    <Button asChild size="sm" variant="outline">
                                                        <a href={edition.pdf_url} download>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    onClick={() => openReviewDialog(edition, "approve")}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Approve & Publish
                                                </Button>
                                                <Button
                                                    onClick={() => openReviewDialog(edition, "reject")}
                                                    variant="destructive"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={!!selectedEdition && !!action} onOpenChange={() => setSelectedEdition(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {action === "approve" ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    Confirm Publication
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    Confirm Rejection
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {action === "approve"
                                ? "This will publish the magazine and make it the current live edition, replacing any previous edition."
                                : "Please provide a reason for rejection to help the editor improve."}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedEdition && (
                        <div className="py-4">
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                <p className="font-medium text-sm text-slate-900">
                                    {selectedEdition.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    By {selectedEdition.published_by?.name}
                                </p>
                            </div>

                            {action === "reject" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Rejection Reason *
                                    </label>
                                    <Textarea
                                        placeholder="Please explain what needs to be improved..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedEdition(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReview}
                            disabled={processing || (action === "reject" && !rejectionReason.trim())}
                            className={
                                action === "approve"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : undefined
                            }
                            variant={action === "reject" ? "destructive" : "default"}
                        >
                            {processing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : action === "approve" ? (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                            ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                            )}
                            {action === "approve" ? "Publish Edition" : "Reject Edition"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}