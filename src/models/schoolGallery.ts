import mongoose, { Schema, Document } from "mongoose";

export interface SchoolGallery extends Document {
  schoolName: string;
  imageUrl: string;
  description: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: Date;
}

const SchoolGallerySchema = new Schema<SchoolGallery>(
  {
    schoolName: {
       type: String, 
       required: true 
      },

    imageUrl: { 
      type: String,
       required: true 
      },

    description: {
       type: String
       },

    status: { 
      type: String, 
      enum: ["Pending", "Approved", "Rejected"],
       default: "Pending" 
      },
  },
  { timestamps: true }
);

export const SchoolGalleryModel = mongoose.model<SchoolGallery>("SchoolGallery", SchoolGallerySchema);
