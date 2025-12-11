"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam) {
            const errorMessages: Record<string, string> = {
                oauth_failed: "Authentication failed. Please try again.",
                oauth_cancelled: "Authentication was cancelled.",
                no_code: "Invalid authentication response.",
                account_inactive: "Your account has been deactivated. Contact support.",
                authentication_failed: "Authentication failed. Please try again.",
            };
            setError(errorMessages[errorParam] || "An error occurred. Please try again.");
        }
    }, [searchParams]);

    const handleGoogleLogin = () => {
        setLoading(true);
        setError("");
        window.location.href = "/api/auth/google";
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Apodartho</h1>
                        </div>
                        <p className="text-slate-600 text-sm">Wall Magazine of Physics</p>
                    </div>

                    {/* Title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h2>
                        <p className="text-slate-600 text-sm">Sign in with your Google account</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Google Sign In Button */}
                    <Button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-6 text-base shadow-sm"
                        size="lg"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Sign in with Google
                            </>
                        )}
                    </Button>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs text-slate-500 uppercase">Secure Login</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* Info */}
                    <div className="text-center text-sm text-slate-600">
                        <p className="mb-2">Sign in with your college Google account</p>
                        <p className="text-xs text-slate-500">
                            Only authorized users can access the system
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Side - Design */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute top-0 left-0 w-full h-full"
                        style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                            backgroundSize: "40px 40px",
                        }}
                    />
                </div>

                {/* Animated Floating Elements */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div
                    className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "1s" }}
                />

                {/* Content */}
                <div className="relative z-10 max-w-lg text-white">
                    <div className="mb-12">
                        <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 transform hover:scale-110 transition-transform">
                            <BookOpen className="w-12 h-12" />
                        </div>
                        <h2 className="text-4xl font-bold mb-4 leading-tight">
                            Explore Ideas,
                            <br />
                            Share Knowledge
                        </h2>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            Access your personalized dashboard and stay connected with the Apodartho community.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                            <div className="text-2xl font-bold mb-1">500+</div>
                            <div className="text-xs text-slate-300">Articles</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                            <div className="text-2xl font-bold mb-1">200+</div>
                            <div className="text-xs text-slate-300">Contributors</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                            <div className="text-2xl font-bold mb-1">15+</div>
                            <div className="text-xs text-slate-300">Years</div>
                        </div>
                    </div>

                    {/* Security Feature */}
                    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            </svg>
                            <p className="text-sm font-semibold">Secured with Google OAuth</p>
                        </div>
                        <p className="text-sm text-slate-300">
                            Your account is protected with enterprise-grade Google authentication.
                        </p>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-10 right-10 w-20 h-20 border-2 border-white/20 rounded-full" />
                <div className="absolute bottom-10 left-10 w-16 h-16 border-2 border-white/20 rounded-lg rotate-45" />
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <LoginContent />
        </Suspense>
    );
}