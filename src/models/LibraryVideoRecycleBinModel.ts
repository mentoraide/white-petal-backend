import mongoose, { Document, Schema } from "mongoose";

export interface ILibraryRecycleBin extends Document {
  originalVideoId: mongoose.Types.ObjectId;
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  videoUrl: string; // changed from pdfUrl
  coverImage: string;
  description: string;
  uploadedBy: mongoose.Types.ObjectId;
  approved: boolean;
  deletedAt: Date;
}

const LibraryRecycleBinSchema = new Schema<ILibraryRecycleBin>({

  originalVideoId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "LibraryVideo"
  },

  title: { type: String },
  author: { type: String },
  subject: { type: String },
  keywords: [{ type: String }],
  coverImage: {
    type: String,
  },
  description: {
    type: String,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  videoUrl: {
    type: String
  },
  deletedAt: {
    type: Date,
    default: Date.now,
    index: { expires: "30d" }
  },

});

const RecycleBinModel = mongoose.model<ILibraryRecycleBin>("LibraryVideoRecycleBin", LibraryRecycleBinSchema);
export default RecycleBinModel;
