"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const InvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    instructor: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
    videoIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Video" }],
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Invoice", InvoiceSchema);
