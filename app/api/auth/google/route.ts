// app/api/auth/google/route.ts
import { getGoogleAuthUrl } from "@/lib/oauth/google";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const authUrl = getGoogleAuthUrl();
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error("[ERROR] Google OAuth initiate error:", error);
        return NextResponse.redirect("/auth/login?error=oauth_failed");
    }
}