import mongoose, { Schema, Document } from 'mongoose';

interface GalleryImage extends Document {
  imageUrl: string;
  title:string;
  schoolName:string
  uploadedBy: mongoose.Schema.Types.ObjectId;
  approved: boolean;
  createdAt: Date;
}


const GallerySchema = new Schema({
  imageUrl: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  schoolName: {
    type: String,
    required: true
  },

  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

},{timestamps:true});

export default mongoose.model<GalleryImage>('Gallery', GallerySchema);
