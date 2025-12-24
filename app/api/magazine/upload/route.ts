// app/api/magazine/upload/route.ts
// IMPORTANT: File must be at exactly this path!

import MagazineEdition from "@/app/models/MagazineEdition";
import { requirePermission } from "@/lib/auth/permissions";
import { uploadFile, validateFile } from "@/lib/blob";
import { dbConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        // 1. Auth & Permission Check - Editors can upload
        const { error, profile } = await requirePermission("upload_designed_version");
        if (error) return error;

        await dbConnect();

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const academicYear = formData.get("academic_year") as string;

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }
        if (!title) {
            return NextResponse.json({ message: "Title is required" }, { status: 400 });
        }

        // 3. Validate File (PDF only, max 50MB)
        const validation = await validateFile(file, ["application/pdf"], 50 * 1024 * 1024);
        if (!validation.valid) {
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        // 4. Upload to Vercel Blob
        const filename = `editions/${new Date().getFullYear()}/${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const url = await uploadFile(file, filename);

        // 5. Create new edition record (NOT published yet, awaiting approval)
        const newEdition = await MagazineEdition.create({
            title,
            pdf_url: url,
            published_by: profile._id,
            published_at: new Date(),
            is_current: false,
            description: description || undefined,
            academic_year: academicYear || undefined,
            file_size: file.size,
            status: "AWAITING_APPROVAL",
        });

        console.log(`[INFO] Magazine edition uploaded by ${profile.name}: ${title}`);

        return NextResponse.json(
            {
                message: "Magazine uploaded successfully and sent for review",
                edition: {
                    id: newEdition._id,
                    title: newEdition.title,
                    status: "AWAITING_APPROVAL",
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("[ERROR] Magazine upload failed:", error);
        return NextResponse.json(
            { 
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// GET - List all magazine editions with status
export async function GET(req: Request) {
    try {
        const { error, profile } = await requirePermission("upload_designed_version");
        if (error) return error;

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const query: any = {};
        if (status) {
            query.status = status;
        }

        const editions = await MagazineEdition.find(query)
            .populate("published_by", "name email")
            .sort({ published_at: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({
            editions: editions.map((ed: any) => ({
                id: ed._id.toString(),
                title: ed.title,
                description: ed.description,
                academic_year: ed.academic_year,
                pdf_url: ed.pdf_url,
                status: ed.status || (ed.is_current ? "PUBLISHED" : "AWAITING_APPROVAL"),
                is_current: ed.is_current,
                published_by: ed.published_by,
                published_at: ed.published_at,
                file_size: ed.file_size,
                rejection_reason: ed.rejection_reason,
            })),
        });
    } catch (error: any) {
        console.error("[ERROR] Fetch editions failed:", error);
        return NextResponse.json(
            { 
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 500 }
        );
    }
}