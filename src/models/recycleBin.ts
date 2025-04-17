import mongoose, { Document, Schema } from "mongoose";

export interface IRecycleBin extends Document {
  originalVideoId: mongoose.Types.ObjectId;
  courseName: string;
  courseContent: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  status:  string; 
  uploadedBy: mongoose.Types.ObjectId;
  deletedAt: Date;
}

const recycleBinSchema = new Schema<IRecycleBin>({

  originalVideoId: {
     type: Schema.Types.ObjectId,
      required: true,
      ref: "Video" 
    },

  courseName: {
     type: String 
    },

  courseContent: {
     type: String 
    },

  videoUrl: { 
    type: String 
},

description: { 
    type: String
 }, 

 status: { 
    type: String 
},

  thumbnailUrl: { 
    type: String 
},

  uploadedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User"
 },

  deletedAt: { 
    type: Date, 
    default: Date.now,
     index: { expires: "30d" } 
    },

});

const RecycleBinModel = mongoose.model<IRecycleBin>("RecycleBin", recycleBinSchema);
export default RecycleBinModel;
