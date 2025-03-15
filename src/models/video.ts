import mongoose, { Document, Schema } from "mongoose";

interface Video extends Document {
    courseName: string; 
    courseContent: string; 
    videoUrl: string; 
    description: string;
    status: "pending" | "approved" | "rejected";
    uploadedBy: mongoose.Types.ObjectId; 
    watchedBy: mongoose.Types.ObjectId[]; 
    sequence: number; 
    thumbnailUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

const VideoSchema = new Schema<Video>(
    {
        courseName: {
            type: String,
            required: true
        },

        courseContent: {
            type: String,
            required: true
        },

        videoUrl: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        status: { 
            type: String, 
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User", 
            required: true
        },

        watchedBy: [{ 
            type: Schema.Types.ObjectId,
            ref: "User" 
        }], // Users who watched

        thumbnailUrl: { 
            type: String,
            required: true 
        },

        sequence: { 
            type: Number, 
            default: 1 
        }, // Ensure unique invoice numbers
    },
    { timestamps: true }
);

const VideoModel = mongoose.model<Video>("Video", VideoSchema);
export default VideoModel;
