"use client";

import React, { useState } from "react";
import { useAuth, ProtectedRoute } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileText, Upload, ImageIcon, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function ContributePage() {
    return (
        <ProtectedRoute>
            <div className="container max-w-3xl py-10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Submit Your Work</h1>
                    <p className="text-muted-foreground">
                        Contribute articles, poems, or research to the Apodartho eMagazine.
                    </p>
                </div>
                <ContributeForm />
            </div>
        </ProtectedRoute>
    );
}

function ContributeForm() {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [images, setImages] = useState<File[]>([]);

    const handleSubmit = async (type: "paste" | "upload" | "image_upload") => {
        if (!title) {
            toast.error("Please provide a title for your work.");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append("title", title);
            data.append("submission_type", type);

            if (type === "paste") {
                if (!content) throw new Error("Content cannot be empty");
                data.append("raw_content", content);
            } else if (type === "upload") {
                if (!file) throw new Error("Please select a file");
                data.append("file", file);
            } else if (type === "image_upload") {
                if (images.length === 0) throw new Error("Please select images");
                images.forEach(img => data.append("images", img));
            }

            const res = await fetch("/api/posts", {
                method: "POST",
                body: data,
            });

            if (!res.ok) throw new Error("Submission failed");

            toast.success("Successfully submitted for review!");
            // Reset form
            setTitle("");
            setContent("");
            setFile(null);
            setImages([]);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-muted bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Submission Details</CardTitle>
                <CardDescription>Choose how you want to provide your content.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title of your work</Label>
                        <Input 
                            id="title" 
                            placeholder="e.g. The Quantum Leap in Modern Physics" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-medium"
                        />
                    </div>

                    <Tabs defaultValue="write" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="write">
                                <FileText className="w-4 h-4 mr-2" /> Write
                            </TabsTrigger>
                            <TabsTrigger value="upload">
                                <Upload className="w-4 h-4 mr-2" /> File Upload
                            </TabsTrigger>
                            <TabsTrigger value="images">
                                <ImageIcon className="w-4 h-4 mr-2" /> Artwork
                            </TabsTrigger>
                        </TabsList>

                        {/* --- WRITE TAB --- */}
                        <TabsContent value="write" className="space-y-4">
                            <Textarea 
                                placeholder="Start typing your article, poem, or story here..." 
                                className="min-h-[300px] font-mono text-sm leading-relaxed"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button onClick={() => handleSubmit("paste")} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Text
                                </Button>
                            </div>
                        </TabsContent>

                        {/* --- UPLOAD TAB --- */}
                        <TabsContent value="upload" className="space-y-4">
                            <div className="border-2 border-dashed rounded-xl p-10 text-center hover:bg-muted/50 transition-colors">
                                <Input 
                                    type="file" 
                                    className="hidden" 
                                    id="file-upload"
                                    accept=".pdf,.docx,.txt"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                    <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <span className="text-lg font-semibold">
                                        {file ? file.name : "Click to upload document"}
                                    </span>
                                    <span className="text-sm text-muted-foreground mt-1">
                                        PDF, DOCX, or TXT (Max 16MB)
                                    </span>
                                </Label>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => handleSubmit("upload")} disabled={loading || !file}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit File
                                </Button>
                            </div>
                        </TabsContent>

                        {/* --- IMAGES TAB --- */}
                        <TabsContent value="images" className="space-y-4">
                            <div className="border-2 border-dashed rounded-xl p-10 text-center hover:bg-muted/50 transition-colors">
                                <Input 
                                    type="file" 
                                    className="hidden" 
                                    id="image-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => setImages(Array.from(e.target.files || []))}
                                />
                                <Label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                                    <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                    <span className="text-lg font-semibold">Click to upload images</span>
                                    <span className="text-sm text-muted-foreground mt-1">
                                        JPG, PNG (Max 10MB each)
                                    </span>
                                </Label>
                            </div>
                            
                            {/* Image Preview List */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative group border rounded-lg p-2">
                                            <p className="text-xs truncate">{img.name}</p>
                                            <button 
                                                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button onClick={() => handleSubmit("image_upload")} disabled={loading || images.length === 0}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Artwork
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
}