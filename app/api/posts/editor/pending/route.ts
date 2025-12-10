// app/api/posts/editor/pending/route.ts
import Post from "@/app/models/Post";
import { requirePermission } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/mongoose";
import { validatePagination } from "@/lib/security/validators";
import { NextResponse } from "next/server";

// GET - Fetch pending posts for editor review
export async function GET(req: Request) {
    try {
        // Check permissions - editors and above can view
        const { error, profile } = await requirePermission("view_pending_submissions");
        if (error) return error;

        // Ensure DB connection
        try {
            await dbConnect();
        } catch (dbError) {
            console.error("[ERROR] Database connection failed:", dbError);
            return NextResponse.json(
                { message: "Database connection failed. Please try again." },
                { status: 503 }
            );
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "PENDING_REVIEW";
        const category = searchParams.get("category");
        const page = searchParams.get("page");
        const limit = searchParams.get("limit");

        // Validate pagination
        const pageCheck = validatePagination(page, limit);
        if (!pageCheck.valid) {
            return NextResponse.json({ message: pageCheck.error }, { status: 400 });
        }

        const pageNum = parseInt(page || "1");
        const limitNum = parseInt(limit || "10");
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query: any = { status };

        // Filter by category if provided
        if (category && category !== "all") {
            query.category = category;
        }

        // Fetch posts with author info
        let posts;
        try {
            posts = await Post.find(query)
                .populate("author", "name email profile_picture_url")
                .populate("reviewed_by", "name")
                .sort({ created_at: 1 }) // FIFO - oldest first
                .skip(skip)
                .limit(limitNum)
                .select("title category submission_type status created_at author_name updated_at")
                .maxTimeMS(10000)
                .lean()
                .exec();
        } catch (queryError) {
            console.error("[ERROR] Posts query failed:", queryError);
            return NextResponse.json(
                { message: "Failed to fetch posts. Please try again." },
                { status: 500 }
            );
        }

        const total = await Post.countDocuments(query).maxTimeMS(5000);

        // Get statistics for the editor dashboard
        let stats;
        try {
            stats = await Post.aggregate([
                {
                    $match: {
                        status: {
                            $in: ["PENDING_REVIEW", "ACCEPTED", "DESIGNING", "AWAITING_ADMIN", "ADMIN_REJECTED"],
                        },
                    },
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]).option({ maxTimeMS: 5000 }).exec();
        } catch (statsError) {
            console.error("[ERROR] Stats query failed:", statsError);
            stats = [];
        }

        const statusCounts = stats.reduce((acc: Record<string, number>, stat: any) => {
            acc[stat._id.toLowerCase().replace("_", " ")] = stat.count;
            return acc;
        }, {} as Record<string, number>);

        // Category breakdown for current view
        let categoryStats;
        try {
            categoryStats = await Post.aggregate([
                { $match: { status } },
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 },
                    },
                },
            ]).option({ maxTimeMS: 5000 }).exec();
        } catch (catError) {
            console.error("[ERROR] Category stats query failed:", catError);
            categoryStats = [];
        }

        const categoryCounts = categoryStats.reduce((acc: Record<string, number>, stat: any) => {
            acc[stat._id || "uncategorized"] = stat.count;
            return acc;
        }, {} as Record<string, number>);

        // Format posts for frontend
        const formattedPosts = posts.map((post: any) => ({
            _id: post._id.toString(),
            title: post.title,
            author_name: post.author?.name || post.author_name,
            author_email: post.author?.email || "N/A",
            author_avatar: post.author?.profile_picture_url || null,
            category: post.category || "uncategorized",
            submission_type: post.submission_type,
            status: post.status,
            created_at: post.created_at,
            updated_at: post.updated_at,
            reviewed_by: post.reviewed_by?.name || null,
        }));

        return NextResponse.json(
            {
                posts: formattedPosts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum),
                    hasMore: skip + posts.length < total,
                },
                stats: {
                    pending_review: statusCounts["pending review"] || 0,
                    accepted: statusCounts["accepted"] || 0,
                    designing: statusCounts["designing"] || 0,
                    awaiting_admin: statusCounts["awaiting admin"] || 0,
                    admin_rejected: statusCounts["admin rejected"] || 0,
                },
                category_breakdown: categoryCounts,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[ERROR] Fetch pending posts error:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}