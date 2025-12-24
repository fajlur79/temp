// app/models/Profiles.ts

import mongoose, { Schema, Model } from "mongoose";

/* ============================================================
   BASE INTERFACE (RAW DATA SHAPE)
   Does NOT extend Document. Keeps things clean.
   ============================================================ */

export type Role = "user" | "editor" | "publisher" | "admin";

export interface IProfiles {
    google_id: string; // Sparse unique index required if optional
    email: string;
    google_picture?: string;

    name: string;
    
    bio?: string;
    profile_picture_url?: string;

    social_links?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
    };

    roles: Role[];

    auth_provider: "google";
    is_active: boolean;
    last_login?: Date;
    created_at?: Date;
    updated_at?: Date;
}

/* ============================================================
   DOCUMENT INTERFACE (Mongoose-enhanced object)
   ============================================================ */

export interface ProfileDocument extends mongoose.Document, IProfiles {
    hasRole(role: Role): boolean;
    hasAnyRole(roles: Role[]): boolean;
    hasAllRoles(roles: Role[]): boolean;
    addRole(role: Role): void;
    removeRole(role: Role): void;
    getPrimaryRole(): Role;
}

/* ============================================================
   MODEL INTERFACE (Static methods)
   ============================================================ */

export interface ProfilesModel extends Model<ProfileDocument> {
    findByRole(role: Role): Promise<ProfileDocument[]>;
    findEditorPublishers(): Promise<ProfileDocument[]>;
    search(query: string, limit?: number): Promise<ProfileDocument[]>;
}

/* ============================================================
   SCHEMA
   ============================================================ */

const ProfilesSchema = new Schema<ProfileDocument, ProfilesModel>(
    {
        google_id: {
            type: String,
            required: true,
            unique: true,
            sparse: true,
            trim: true,
        },
        google_picture: {
            type: String,
            trim: true,
        },

        // Basic Info
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        bio: {
            type: String,
            maxlength: 500,
            trim: true,
        },
        profile_picture_url: {
            type: String,
            trim: true,
        },

        // Social Links
        social_links: {
            linkedin: { type: String, trim: true },
            twitter: { type: String, trim: true },
            facebook: { type: String, trim: true },
            instagram: { type: String, trim: true },
        },

        // Roles
        roles: {
            type: [String],
            enum: ["user", "editor", "publisher", "admin"],
            default: ["user"],
            validate: {
                validator(roles: Role[]) {
                    if (roles.length === 0) return false;
                    if (roles.includes("admin") && roles.length > 1) return false;
                    return new Set(roles).size === roles.length;
                },
                message: "Invalid role configuration.",
            },
        },

        auth_provider: {
            type: String,
            enum: ["google"],
            required: true,
            default: "google",
        },

        is_active: {
            type: Boolean,
            default: true,
            index: true,
        },

        last_login: {
            type: Date,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/* ============================================================
   INDEXES
   ============================================================ */

ProfilesSchema.index({ roles: 1, is_active: 1 });
ProfilesSchema.index({ name: "text", email: "text" });

/* ============================================================
   INSTANCE METHODS
   ============================================================ */

ProfilesSchema.methods.hasRole = function (this: ProfileDocument, role: Role) {
    if (this.roles.includes("admin")) return true;
    return this.roles.includes(role);
};

ProfilesSchema.methods.hasAnyRole = function (
    this: ProfileDocument,
    roles: Role[]
) {
    if (this.roles.includes("admin")) return true;
    return roles.some((r) => this.roles.includes(r));
};

ProfilesSchema.methods.hasAllRoles = function (
    this: ProfileDocument,
    roles: Role[]
) {
    if (this.roles.includes("admin")) return true;
    return roles.every((r) => this.roles.includes(r));
};

ProfilesSchema.methods.addRole = function (
    this: ProfileDocument,
    role: Role
) {
    if (this.roles.includes("admin")) return; // Admin can't change roles
    if (!this.roles.includes(role)) this.roles.push(role);
};

ProfilesSchema.methods.removeRole = function (
    this: ProfileDocument,
    role: Role
) {
    if (this.roles.includes("admin")) return; // Immutable admin
    this.roles = this.roles.filter((r) => r !== role);
    if (this.roles.length === 0) this.roles.push("user");
};

ProfilesSchema.methods.getPrimaryRole = function (this: ProfileDocument) {
    const priority: Record<Role, number> = {
        admin: 4,
        publisher: 3,
        editor: 2,
        user: 1,
    };

    return [...this.roles].sort(
        (a, b) => priority[b] - priority[a]
    )[0];
};

/* ============================================================
   STATIC METHODS
   ============================================================ */

ProfilesSchema.statics.findByRole = function (role: Role) {
    return this.find({ roles: role, is_active: true });
};

ProfilesSchema.statics.findEditorPublishers = function () {
    return this.find({
        roles: { $all: ["editor", "publisher"] },
        is_active: true,
    });
};

ProfilesSchema.statics.search = function (query: string, limit = 20) {
    return this.find(
        {
            $text: { $search: query },
            is_active: true,
        },
        { score: { $meta: "textScore" } }
    )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit);
};

/* ============================================================
   VIRTUALS
   ============================================================ */

ProfilesSchema.virtual("isAdmin").get(function (this: ProfileDocument) {
    return this.hasRole("admin");
});

ProfilesSchema.virtual("isEditor").get(function (this: ProfileDocument) {
    return this.hasRole("editor");
});

ProfilesSchema.virtual("isPublisher").get(function (this: ProfileDocument) {
    return this.hasRole("publisher");
});

ProfilesSchema.virtual("displayInfo").get(function (this: ProfileDocument) {
    return {
        id: this._id.toString(),
        name: this.name,
        email: this.email,
        primaryRole: this.getPrimaryRole(),
        allRoles: this.roles,
        avatar: this.profile_picture_url || this.google_picture,
    };
});

/* ============================================================
   PRE-SAVE HOOKS (async = no TS errors)
   ============================================================ */

ProfilesSchema.pre("save", async function (this: ProfileDocument) {
    if (this.isModified("email")) {
        this.email = this.email.toLowerCase().trim();
    }
});

/* ============================================================
   MODEL EXPORT
   ============================================================ */

const Profiles =
    mongoose.models.Profiles ||
    mongoose.model<ProfileDocument, ProfilesModel>(
        "Profiles",
        ProfilesSchema
    );

export default Profiles;
