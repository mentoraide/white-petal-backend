import mongoose, { Schema, Document } from "mongoose";

export interface WatchedVideo extends Document {
    videoId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    watchedAt: Date;
}

const WatchedVideoSchema = new Schema<WatchedVideo>(
    {
        videoId: { 
            type: Schema.Types.ObjectId,
             ref: "Video",
             required: true
             },

        userId: { 
            type: Schema.Types.ObjectId, 
            ref: "User",
             required: true
             },

        watchedAt: {
             type: Date, 
             default: Date.now 
            }
    },
    { timestamps: true }
);

export default mongoose.model<WatchedVideo>("WatchedVideo", WatchedVideoSchema);
