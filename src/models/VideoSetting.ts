import mongoose, { Document, Model, Schema } from "mongoose";

// 1. Define an interface for the schema
export interface IVideoSetting extends Document {
  pricePerVideo: string;
  maxVideoLength: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Create the schema
const videoSettingSchema: Schema<IVideoSetting> = new Schema(
  {
    pricePerVideo: { 
        type: String,
         required: true
         },

    maxVideoLength: { 
        type: String,
         required: true 
        }, // in minutes
  },
  { timestamps: true }
);

// 3. Create the model with types
const VideoSetting: Model<IVideoSetting> = mongoose.model<IVideoSetting>(
  "VideoSetting",
  videoSettingSchema
);

export default VideoSetting;
