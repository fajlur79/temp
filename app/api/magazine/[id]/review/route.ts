// app/api/magazine/[id]/review/route.ts
import MagazineEdition from "@/app/models/MagazineEdition";
import { requirePermission } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/mongoose";
import { validateAction, validateObjectId, validateRejectionReason } from "@/lib/security/validators";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;

        // Validate ID
        const idCheck = validateObjectId(id);
        if (!idCheck.valid) {
            return NextResponse.json({ message: idCheck.error }, { status: 400 });
        }

        // 1. Permission Check - Publishers and Admins can approve/reject
        const { error, profile } = await requirePermission("publish_post");
        if (error) return error;

        await dbConnect();

        // 2. Parse Body
        const body = await req.json();
        const { action, rejection_reason } = body;

        // Validate action
        const actionCheck = validateAction(action, ["approve", "reject"]);
        if (!actionCheck.valid) {
            return NextResponse.json({ message: actionCheck.error }, { status: 400 });
        }

        // Find edition
        const edition = await MagazineEdition.findById(id);
        if (!edition) {
            return NextResponse.json({ message: "Magazine edition not found" }, { status: 404 });
        }

        // Check if already published or rejected
        if (edition.status === "PUBLISHED") {
            return NextResponse.json(
                { message: "This edition is already published" },
                { status: 400 }
            );
        }

        // 3. Apply Action
        if (action === "approve") {
            // Set all other editions to not current
            await MagazineEdition.updateMany({ _id: { $ne: id } }, { is_current: false });

            // Publish this edition
            edition.is_current = true;
            edition.status = "PUBLISHED";
            edition.published_at = new Date();
            edition.rejection_reason = undefined;

            await edition.save();

            console.log(`[INFO] Magazine edition published by ${profile.name}: ${edition.title}`);

            return NextResponse.json(
                {
                    message: "Magazine edition published successfully",
                    edition: {
                        id: edition._id,
                        title: edition.title,
                        status: "PUBLISHED",
                    },
                },
                { status: 200 }
            );
        } else if (action === "reject") {
            // Validate rejection reason
            const reasonCheck = validateRejectionReason(rejection_reason);
            if (!reasonCheck.valid) {
                return NextResponse.json({ message: reasonCheck.error }, { status: 400 });
            }

            edition.status = "REJECTED";
            edition.rejection_reason = reasonCheck.sanitized;
            edition.is_current = false;

            await edition.save();

            console.log(`[INFO] Magazine edition rejected by ${profile.name}: ${edition.title}`);

            return NextResponse.json(
                {
                    message: "Magazine edition rejected",
                    edition: {
                        id: edition._id,
                        title: edition.title,
                        status: "REJECTED",
                        rejection_reason: edition.rejection_reason,
                    },
                },
                { status: 200 }
            );
        }
    } catch (error) {
        console.error("[ERROR] Magazine review failed:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// GET - Get single edition details
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;

        const idCheck = validateObjectId(id);
        if (!idCheck.valid) {
            return NextResponse.json({ message: idCheck.error }, { status: 400 });
        }

        const { error } = await requirePermission("upload_designed_version");
        if (error) return error;

        await dbConnect();

        const edition = await MagazineEdition.findById(id)
            .populate("published_by", "name email profile_picture_url")
            .lean();

        if (!edition) {
            return NextResponse.json({ message: "Edition not found" }, { status: 404 });
        }

        return NextResponse.json({
            edition: {
                id: edition._id.toString(),
                title: edition.title,
                description: edition.description,
                academic_year: edition.academic_year,
                pdf_url: edition.pdf_url,
                status: edition.status || (edition.is_current ? "PUBLISHED" : "AWAITING_APPROVAL"),
                is_current: edition.is_current,
                published_by: edition.published_by,
                published_at: edition.published_at,
                file_size: edition.file_size,
                rejection_reason: edition.rejection_reason,
            },
        });
    } catch (error) {
        console.error("[ERROR] Get edition failed:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}