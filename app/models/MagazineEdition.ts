// app/models/MagazineEdition.ts (Updated with status field)

import mongoose, { Schema, Model } from "mongoose";

export interface IMagazineEdition {
    title: string;
    pdf_url: string;
    cover_image_url?: string;

    published_by: mongoose.Types.ObjectId;
    published_at: Date;

    is_current: boolean;
    status: "AWAITING_APPROVAL" | "REJECTED" | "PUBLISHED"; // NEW FIELD

    description?: string;
    academic_year?: string;

    file_size?: number;
    page_count?: number;
    downloads?: number;

    rejection_reason?: string; // NEW FIELD

    createdAt?: Date;
    updatedAt?: Date;
}

export interface MagazineEditionDocument
    extends mongoose.Document,
        IMagazineEdition {
    makeCurrent(): Promise<MagazineEditionDocument>;
    incrementDownloads(): Promise<MagazineEditionDocument>;

    // virtuals
    fileSizeFormatted: string;
    isArchive: boolean;
}

export interface MagazineEditionModel
    extends Model<MagazineEditionDocument> {
    getCurrent(): Promise<MagazineEditionDocument | null>;
    getArchive(limit?: number): Promise<MagazineEditionDocument[]>;
    getByYear(year: string): Promise<MagazineEditionDocument[]>;
    getAwaitingApproval(): Promise<MagazineEditionDocument[]>; // NEW METHOD
}

const MagazineEditionSchema = new Schema<
    MagazineEditionDocument,
    MagazineEditionModel
>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        pdf_url: {
            type: String,
            required: true,
        },
        cover_image_url: {
            type: String,
            trim: true,
        },

        published_by: {
            type: Schema.Types.ObjectId,
            ref: "Profiles",
            required: true,
            index: true,
        },
        published_at: {
            type: Date,
            default: Date.now,
            index: true,
        },

        is_current: {
            type: Boolean,
            default: false,
            index: true,
        },

        // NEW STATUS FIELD
        status: {
            type: String,
            enum: ["AWAITING_APPROVAL", "REJECTED", "PUBLISHED"],
            default: "AWAITING_APPROVAL",
            index: true,
        },

        description: {
            type: String,
            maxlength: 1000,
        },

        academic_year: {
            type: String,
            trim: true,
            index: true,
        },

        file_size: {
            type: Number,
            min: 0,
        },
        page_count: {
            type: Number,
            min: 0,
        },
        downloads: {
            type: Number,
            default: 0,
            min: 0,
        },

        // NEW REJECTION REASON FIELD
        rejection_reason: {
            type: String,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// INDEXES
MagazineEditionSchema.index({ is_current: 1 });
MagazineEditionSchema.index({ published_at: -1 });
MagazineEditionSchema.index({ academic_year: -1 });
MagazineEditionSchema.index({ status: 1 }); // NEW INDEX

// INSTANCE METHODS
MagazineEditionSchema.methods.makeCurrent = async function () {
    const EditionModel = mongoose.model<
        MagazineEditionDocument,
        MagazineEditionModel
    >("MagazineEdition");

    await EditionModel.updateMany(
        { _id: { $ne: this._id } },
        { is_current: false }
    );

    this.is_current = true;
    this.status = "PUBLISHED";
    return this.save();
};

MagazineEditionSchema.methods.incrementDownloads = async function () {
    this.downloads = (this.downloads || 0) + 1;
    return this.save();
};

// STATIC METHODS
MagazineEditionSchema.statics.getCurrent = function () {
    return this.findOne({ is_current: true, status: "PUBLISHED" }).populate(
        "published_by",
        "name email profile_picture_url"
    );
};

MagazineEditionSchema.statics.getArchive = function (limit = 50) {
    return this.find({ is_current: false, status: "PUBLISHED" })
        .sort({ published_at: -1 })
        .limit(limit)
        .populate("published_by", "name");
};

MagazineEditionSchema.statics.getByYear = function (year: string) {
    return this.find({ academic_year: year, status: "PUBLISHED" })
        .sort({ published_at: -1 })
        .populate("published_by", "name");
};

// NEW STATIC METHOD
MagazineEditionSchema.statics.getAwaitingApproval = function () {
    return this.find({ status: "AWAITING_APPROVAL" })
        .sort({ published_at: -1 })
        .populate("published_by", "name email");
};

// VIRTUALS
MagazineEditionSchema.virtual("fileSizeFormatted").get(function (
    this: MagazineEditionDocument
) {
    if (!this.file_size) return "Unknown";
    const mb = this.file_size / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
});

MagazineEditionSchema.virtual("isArchive").get(function (
    this: MagazineEditionDocument
) {
    return !this.is_current && this.status === "PUBLISHED";
});

// PRE-SAVE HOOK
MagazineEditionSchema.pre("save", async function () {
    if (this.isModified("is_current") && this.is_current) {
        const EditionModel = mongoose.model<
            MagazineEditionDocument,
            MagazineEditionModel
        >("MagazineEdition");

        await EditionModel.updateMany(
            { _id: { $ne: this._id } },
            { is_current: false }
        );

        // If setting as current, status must be PUBLISHED
        this.status = "PUBLISHED";
    }
});

const MagazineEdition =
    (mongoose.models.MagazineEdition as MagazineEditionModel) ||
    mongoose.model<MagazineEditionDocument, MagazineEditionModel>(
        "MagazineEdition",
        MagazineEditionSchema
    );

export default MagazineEdition;