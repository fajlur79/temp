// app/api/auth/google/callback/route.ts
import Profiles from "@/app/models/Profiles";
import { dbConnect } from "@/lib/mongoose";
import { getGoogleTokens, getGoogleUserInfo } from "@/lib/oauth/google";
import { createSessionToken, setSessionCookie, updateLastLogin } from "@/lib/auth/middleware";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        // Handle OAuth errors
        if (error) {
            console.error("[ERROR] Google OAuth error:", error);
            return NextResponse.redirect(
                new URL("/auth/login?error=oauth_cancelled", req.url)
            );
        }

        if (!code) {
            return NextResponse.redirect(
                new URL("/auth/login?error=no_code", req.url)
            );
        }

        // 1. Exchange code for tokens
        const tokens = await getGoogleTokens(code);

        // 2. Get user info from Google
        const googleUser = await getGoogleUserInfo(tokens.access_token);

        // 3. Connect to database
        await dbConnect();

        // 4. Find or create profile
        let profile = await Profiles.findOne({ google_id: googleUser.id });

        if (!profile) {
            // Check if email already exists (migration case)
            const existingByEmail = await Profiles.findOne({ 
                email: googleUser.email.toLowerCase() 
            });

            if (existingByEmail) {
                // Link existing account to Google
                existingByEmail.google_id = googleUser.id;
                existingByEmail.google_email = googleUser.email;
                existingByEmail.google_picture = googleUser.picture;
                existingByEmail.auth_provider = "google";
                await existingByEmail.save();
                profile = existingByEmail;
            } else {
                // Create new user account
                profile = await Profiles.create({
                    google_id: googleUser.id,
                    google_email: googleUser.email,
                    google_picture: googleUser.picture,
                    name: googleUser.name,
                    email: googleUser.email.toLowerCase(),
                    roles: ["user"],
                    auth_provider: "google",
                    is_active: true,
                });
            }
        }

        // 5. Check if account is active
        if (!profile.is_active) {
            return NextResponse.redirect(
                new URL("/auth/login?error=account_inactive", req.url)
            );
        }

        // 6. Update last login
        await updateLastLogin(profile._id.toString());

        // 7. Create session token
        const sessionToken = createSessionToken(profile);

        // 8. Set session cookie
        await setSessionCookie(sessionToken);

        // 9. Redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url));
    } catch (error) {
        console.error("[ERROR] Google OAuth callback error:", error);
        return NextResponse.redirect(
            new URL("/auth/login?error=authentication_failed", req.url)
        );
    }
}