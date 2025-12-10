// app/api/posts/my-submissions/route.ts
import Post from "@/app/models/Post";
import Profiles from "@/app/models/Profiles";
import { requireAuth } from "@/lib/auth/middleware";
import { dbConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";

// GET - Fetch current user's submissions
export async function GET(req: Request) {
    try {
        const { error, user } = await requireAuth();
        if (error) return error;

        try {
            await dbConnect();
        } catch (dbError) {
            console.error("[ERROR] Database connection failed:", dbError);
            return NextResponse.json(
                { message: "Database connection failed. Please try again." },
                { status: 503 }
            );
        }

        // Get user's profile to find their ObjectId
        let profile;
        try {
            profile = await Profiles.findOne({ id_number: user.id_number })
                .select("_id")
                .maxTimeMS(5000)
                .lean()
                .exec();

            if (!profile) {
                return NextResponse.json(
                    { message: "Profile not found" },
                    { status: 404 }
                );
            }
        } catch (profileError) {
            console.error("[ERROR] Profile query failed:", profileError);
            return NextResponse.json(
                { message: "Failed to fetch profile. Please try again." },
                { status: 500 }
            );
        }

        // Find all posts by this user (using author ObjectId)
        let posts;
        try {
            posts = await Post.find({ author: profile._id })
                .sort({ created_at: -1 }) // Newest first
                .select("title category submission_type status created_at")
                .maxTimeMS(10000)
                .lean()
                .exec();
        } catch (queryError) {
            console.error("[ERROR] Posts query failed:", queryError);
            return NextResponse.json(
                { message: "Failed to fetch submissions. Please try again." },
                { status: 500 }
            );
        }

        // Calculate statistics
        const stats = {
            total: posts.length,
            published: posts.filter((p: any) => p.status === "PUBLISHED").length,
            pending: posts.filter((p: any) => p.status === "PENDING_REVIEW").length,
            in_progress: posts.filter((p: any) => 
                ["ACCEPTED", "DESIGNING", "AWAITING_ADMIN", "APPROVED"].includes(p.status)
            ).length,
        };

        // Format posts for frontend
        const formattedPosts = posts.map((post: any) => ({
            _id: post._id.toString(),
            title: post.title,
            category: post.category || "uncategorized",
            submission_type: post.submission_type,
            status: post.status,
            created_at: post.created_at,
            views: 0, // Views field was removed from schema, set to 0
        }));

        return NextResponse.json(
            {
                posts: formattedPosts,
                stats,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[ERROR] Fetch my submissions error:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}