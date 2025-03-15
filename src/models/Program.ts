import mongoose, { Schema, Document } from "mongoose";

export interface IProgramRequest extends Document {
    schoolName: string;
    contactPerson: string;
    schoolID: string;
    email: string;
    phone: string;
    programRequested: string;
    message?: string;
    status: "pending" | "approved" | "rejected";
    requestedBy: mongoose.Schema.Types.ObjectId;
}

const ProgramRequestSchema = new Schema<IProgramRequest>(
    {
        schoolName: { type: String, required: true },
        contactPerson: { type: String, required: true },
        schoolID: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        programRequested: { type: String, required: true },
        message: { type: String },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
    },
    { timestamps: true }
);

export const ProgramRequestModel = mongoose.model<IProgramRequest>(
    "ProgramRequest",
    ProgramRequestSchema
);
