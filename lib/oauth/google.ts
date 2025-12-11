interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    id_token: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

// Get Google OAuth URL
export function getGoogleAuthUrl(): string {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    
    const options = {
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
}

// Exchange authorization code for tokens
export async function getGoogleTokens(code: string): Promise<GoogleTokenResponse> {
    const url = "https://oauth2.googleapis.com/token";
    
    const values = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(values),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch Google tokens: ${error.error_description || error.error}`);
    }

    return response.json();
}

// Get user info from Google
export async function getGoogleUserInfo(access_token: string): Promise<GoogleUserInfo> {
    const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`,
        {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch Google user info");
    }

    return response.json();
}

// Refresh access token
export async function refreshGoogleAccessToken(refresh_token: string): Promise<GoogleTokenResponse> {
    const url = "https://oauth2.googleapis.com/token";
    
    const values = {
        refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(values),
    });

    if (!response.ok) {
        throw new Error("Failed to refresh Google access token");
    }

    return response.json();
}