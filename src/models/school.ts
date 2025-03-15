import mongoose, { Document, Schema } from 'mongoose';

export interface ISchool extends Document {
  schoolName: string;
  schoolID: string;
  headOfSchool: string;
  address: string;
  contact: string;
  message?: string;
  isApproved: boolean;
}

const schoolSchema: Schema = new Schema(
  {
    schoolName: { type: String, required: true, trim: true, lowercase: true },
    schoolID: { type: String, required: true, unique: true, trim: true, index: true },
    headOfSchool: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    contact: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[0-9]{10}$/.test(v); 
        },
        message: (props: { value: string }) => `${props.value} is not a valid contact number!`,
      },
    },
    message: { type: String, default: null, trim: true },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ISchool>('School', schoolSchema);
