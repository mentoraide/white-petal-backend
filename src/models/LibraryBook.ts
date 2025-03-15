import mongoose, { Document, Schema } from 'mongoose';

interface Book extends Document {
    title: string;
    author: string;
    subject: string;
    keywords: string[];
    pdfUrl: string;
    coverImage:string;
    description:string;
    uploadedBy: mongoose.Schema.Types.ObjectId;
    isApproved: boolean; 
    approvedBy?: mongoose.Schema.Types.ObjectId;
}


const BookSchema = new Schema<Book>(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    subject: { type: String, required: true },
    keywords: [{ type: String }],
    pdfUrl: { type: String, required: true },
    coverImage: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isApproved: { type: Boolean, default: false }, 
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

BookSchema.index({ title: 'text', author: 'text', subject: 'text', keywords: 'text' });

export default mongoose.model<Book>('Book', BookSchema);
