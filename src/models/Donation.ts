import mongoose, { Schema, Document } from 'mongoose';

export interface Donation extends Document {
  userId: mongoose.Types.ObjectId; 
  amount: number;
  isAnonymous: boolean;
  donationType: 'one-time' | 'monthly';
  message?: string;
  status: 'pending' | 'completed' | 'failed';
  donerName:string,
  paymentId: string; 
  updatedAt: Date;
}

const DonationSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    donerName:{
     type:String,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },
    donationType: {
      type: String,
      enum: ['one-time', 'monthly'],
      required: true,
    },
    message: {
      type: String,
      default: '', 
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  paymentId: { 
    type: String,
     default: ''
     },
     
  },
  { timestamps: true }
);

export default mongoose.model<Donation>('Donation', DonationSchema);
