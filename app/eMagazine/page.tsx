// app/eMagazine/page.tsx
import PDFViewerWrapper from "@/components/PDFViewerWrapper";
import MagazineEdition from "@/app/models/MagazineEdition";
import { dbConnect } from "@/lib/mongoose";
import { AlertCircle, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function PublicDocPage() {
    try {
        // Connect to database
        await dbConnect();

        // Fetch current magazine edition
        const currentEdition = await MagazineEdition.findOne({ is_current: true })
            .select("title pdf_url academic_year published_at")
            .lean();

        // If no current edition exists
        if (!currentEdition) {
            return (
                <main className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
                    <div className="text-center max-w-md">
                        <div className="inline-flex p-4 bg-slate-100 rounded-full mb-6">
                            <BookOpen className="w-12 h-12 text-slate-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            No Magazine Available
                        </h1>
                        <p className="text-slate-600 mb-6">
                            The current edition hasn't been published yet. Please check back later.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </main>
            );
        }

        // If PDF URL is missing
        if (!currentEdition.pdf_url) {
            return (
                <main className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
                    <div className="text-center max-w-md">
                        <div className="inline-flex p-4 bg-red-100 rounded-full mb-6">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Magazine Error
                        </h1>
                        <p className="text-slate-600 mb-6">
                            The magazine file is temporarily unavailable. Please contact support.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </main>
            );
        }

        return (
            <main className="w-full bg-white p-0 m-0">
                <PDFViewerWrapper 
                    url={currentEdition.pdf_url}
                />
            </main>
        );
    } catch (error) {
        console.error("[ERROR] eMagazine page error:", error);
        
        return (
            <main className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
                <div className="text-center max-w-md">
                    <div className="inline-flex p-4 bg-red-100 rounded-full mb-6">
                        <AlertCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Something Went Wrong
                    </h1>
                    <p className="text-slate-600 mb-6">
                        Unable to load the magazine. Please try again later.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </main>
        );
    }
}