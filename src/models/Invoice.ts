import mongoose, { Schema, Document } from "mongoose";

interface VideoDetails {
    title: string;
    duration: string; 
    ratePerVideo: number;
    totalAmount: number;
}

interface Invoice extends Document {
    invoiceNumber: string;
    date: Date;
    dueDate: Date;
    instructor: mongoose.Types.ObjectId;
    instructorDetails: {
        name: string;
        email: string;
        phone: string;
        address: string;
        gstNumber?: string;
    };
    companyDetails: {
        name: string;
        email: string;
        phone: string;
        address: string;
        gstNumber?: string;
    };
    services: VideoDetails[];
    subTotal: number;
    taxRate: number;
    taxAmount: number;
    discount?: number;
    grandTotal: number;
    paymentDetails: {
        method: string;
        bankName?: string;
        accountHolder?: string;
        accountNumber?: string;
        ifscCode?: string;
        upiId?: string;
    };
    status: string;
    notes?: string;
    email: string;
    pdfUrl?: string; 
    videoIds: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const InvoiceSchema = new Schema<Invoice>({
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    instructorDetails: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        gstNumber: { type: String },
    },
    companyDetails: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        gstNumber: { type: String },
    },
    services: [
        {
            title: { type: String, required: true },
            duration: { type: String, required: true },
            ratePerVideo: { type: Number, required: true },
            totalAmount: { type: Number, required: true },
        },
    ],
    subTotal: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentDetails: {
        method: { type: String, required: true },
        bankName: { type: String },
        accountHolder: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
        upiId: { type: String },
    },
    status: { type: String, enum: ["pending", "paid", "Approved"], default: "pending" },
    notes: { type: String },
    email: { type: String, required: true },
    pdfUrl: { type: String },
    videoIds: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    createdAt: { type: Date, default: Date.now },
},{timestamps:true});

export default mongoose.model<Invoice>("Invoice", InvoiceSchema);
