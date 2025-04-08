import mongoose, { Document, Schema } from 'mongoose';

interface Book extends Document {
    title: string;
    author: string;
    subject: string;
    keywords: string[];
    videoUrl: string; // changed from pdfUrl
    coverImage: string;
    description: string;
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
    videoUrl: { type: String, required: true }, // changed from pdfUrl
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

// ✅ Weighted text index for better search relevance
BookSchema.index(
  {
    title: 'text',
    author: 'text',
    subject: 'text',
    keywords: 'text'
  },
  {
    weights: {
      title: 10,
      author: 5,
      subject: 3,
      keywords: 1
    },
    name: 'LibraryVideoTextIndex'
  }
);

export default mongoose.model<Book>('LibraryVideo', BookSchema);
