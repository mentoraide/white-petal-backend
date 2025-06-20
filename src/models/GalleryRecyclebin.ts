// models/GalleryRecycleBin.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IGalleryRecycleBin extends Document {
  originalImageId: mongoose.Types.ObjectId;
  imageUrl: string;
  title: string;
  schoolName: string;
  uploadedBy: mongoose.Types.ObjectId;
  approved: boolean;
  deletedAt: Date;
}

const GalleryRecycleBinSchema = new Schema<IGalleryRecycleBin>({
  originalImageId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Gallery",
  },
  imageUrl: { type: String },
  title: { type: String },
  schoolName: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approved: { type: Boolean },
  deletedAt: {
    type: Date,
    default: Date.now,
    index: { expires: "30d" }, // auto-delete after 30 days
  },
});

export default mongoose.model<IGalleryRecycleBin>(
  "GalleryImageRecycleBin",
  GalleryRecycleBinSchema
);
