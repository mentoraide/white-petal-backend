"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectInvoice = exports.approveInvoice = void 0;
const Invoice_1 = __importDefault(require("../models/Invoice"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const video_1 = __importDefault(require("../models/video"));
dotenv_1.default.config();
// Nodemailer transporter
const transporter = nodemailer_1.default.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});
// Generate invoice number
const generateInvoiceNumber = (invoiceDate, sequence) => {
    const formattedDate = invoiceDate.toISOString().split("T")[0].replace(/-/g, "");
    return `INV-${formattedDate}-${sequence.toString().padStart(4, "0")}`;
};
// Generate invoice PDF as buffer
const generateInvoicePDF = (invoice) => {
    return new Promise((resolve, reject) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const doc = new pdfkit_1.default();
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        // Header
        doc.fontSize(20).text("Invoice", { align: "center" }).moveDown();
        const invoiceNumber = generateInvoiceNumber(new Date(invoice.createdAt), invoice.sequence || 1);
        doc.fontSize(14).text(`Invoice ID: ${invoiceNumber}`, { align: "center" }).moveDown();
        doc.text("------------------------------------------------------------");
        // Company
        doc.text("Company Details", { underline: true });
        doc.text(`Company Name: ${((_a = invoice.companyDetails) === null || _a === void 0 ? void 0 : _a.name) || "N/A"}`);
        doc.text(`Company Email: ${((_b = invoice.companyDetails) === null || _b === void 0 ? void 0 : _b.email) || "N/A"}`);
        doc.text(`Company Address: ${((_c = invoice.companyDetails) === null || _c === void 0 ? void 0 : _c.address) || "N/A"}`);
        doc.text(`Company Phone: ${((_d = invoice.companyDetails) === null || _d === void 0 ? void 0 : _d.phone) || "N/A"}`).moveDown();
        // Instructor
        doc.text("Instructor Details", { underline: true });
        doc.text(`Instructor Name: ${((_e = invoice.instructor) === null || _e === void 0 ? void 0 : _e.name) || "N/A"}`);
        doc.text(`Instructor Email: ${((_f = invoice.instructor) === null || _f === void 0 ? void 0 : _f.email) || "N/A"}`).moveDown();
        // Services
        doc.text("Services Provided", { underline: true });
        if (Array.isArray(invoice.services) && invoice.services.length > 0) {
            invoice.services.forEach((service, index) => {
                const title = service.title || "N/A";
                const totalAmount = service.totalAmount ? `$${service.totalAmount.toFixed(2)}` : "$0.00";
                if (index > 0)
                    doc.moveDown(0.5).text("----------------------------------------").moveDown(0.5);
                doc.text(`${index + 1}. ${title} - Amount: ${totalAmount}`);
            });
        }
        else {
            doc.text("No services available.");
        }
        doc.moveDown();
        // Payment Summary
        doc.text("Payment Summary", { underline: true });
        doc.fontSize(14).text("Total Amount:", { underline: true });
        doc.fontSize(12).text(`Subtotal: $${invoice.subTotal}`).moveDown(0.5);
        doc.text(`Tax (${invoice.taxRate}%): $${invoice.taxAmount}`).moveDown(0.5);
        doc.text(`Discount: $${invoice.discount || 0}`).moveDown(0.5);
        doc.text(`Grand Total: $${invoice.grandTotal}`).moveDown();
        // Payment Info
        doc.text("Payment Details", { underline: true });
        doc.text(`Payment Method: ${invoice.paymentMethod || "N/A"}`);
        doc.text(`Payment Status: ${invoice.paymentStatus || "N/A"}`);
        doc.text(`Payment Date: ${invoice.paymentDate ? invoice.paymentDate.toLocaleDateString() : "N/A"}`).moveDown();
        // Status
        if (invoice.status === "Approved") {
            doc.text("Status: Approved", { underline: true });
            doc.text(`Approval Date: ${((_g = invoice.approvalDate) === null || _g === void 0 ? void 0 : _g.toLocaleDateString()) || "N/A"}`);
        }
        else if (invoice.status === "Rejected") {
            doc.text("Status: Rejected", { underline: true });
            doc.text(`Rejection Date: ${((_h = invoice.rejectionDate) === null || _h === void 0 ? void 0 : _h.toLocaleDateString()) || "N/A"}`);
            doc.text(`Rejection Reason: ${invoice.rejectionReason || "Rejected due to issues"}`);
        }
        else {
            doc.text("Status: Pending", { underline: true });
        }
        // Notes
        doc.fontSize(14).text("Notes:", { underline: true });
        doc.fontSize(12).text("[Admin Remarks]").moveDown();
        doc.end();
    });
};
// Send invoice via email
const sendInvoiceEmail = (email, pdfBuffer) => {
    if (!email)
        return Promise.reject(new Error("Email is required"));
    return transporter.sendMail({
        from: process.env.SMTP_MAIL,
        to: email,
        subject: "Your Invoice",
        text: "Please find attached your invoice.",
        attachments: [
            {
                filename: "invoice.pdf",
                content: pdfBuffer,
                contentType: "application/pdf",
            },
        ],
    }).then(() => { });
};
// Approve invoice
const approveInvoice = (req, res) => {
    Invoice_1.default.findById(req.params.id)
        .populate("instructor", "name email")
        .then((invoice) => {
        if (!invoice)
            return res.status(404).json({ message: "Invoice not found" });
        if (!invoice.instructor || !invoice.instructor.email) {
            return res.status(400).json({ message: "Instructor email missing" });
        }
        const videoIds = invoice.videoIds || [];
        video_1.default.updateMany({ _id: { $in: videoIds } }, { $set: { isPriced: true } })
            .then(() => {
            const approvalDate = new Date();
            const pdfData = Object.assign(Object.assign({}, invoice.toObject()), { approvalDate, status: "Approved" });
            generateInvoicePDF(pdfData)
                .then((pdfBuffer) => Invoice_1.default.findByIdAndUpdate(req.params.id, { status: "Approved", approvalDate, pdfBuffer }, { new: true }).then((updatedInvoice) => sendInvoiceEmail(invoice.instructor.email, pdfBuffer).then(() => res.json({
                message: "Invoice approved, PDF stored in DB, email sent",
                invoice: updatedInvoice,
            }))))
                .catch((error) => {
                console.error("PDF/email error:", error);
                res.status(500).json({ message: error.message });
            });
        })
            .catch((error) => res.status(500).json({ message: error.message }));
    })
        .catch((error) => res.status(400).json({ message: error.message }));
};
exports.approveInvoice = approveInvoice;
// Reject invoice
const rejectInvoice = (req, res) => {
    Invoice_1.default.findById(req.params.id)
        .populate("instructor", "name email")
        .then((invoice) => {
        if (!invoice)
            return res.status(404).json({ message: "Invoice not found" });
        if (!invoice.instructor || !invoice.instructor.email) {
            return res.status(400).json({ message: "Instructor email missing" });
        }
        const rejectionDate = new Date();
        const pdfData = Object.assign(Object.assign({}, invoice.toObject()), { rejectionDate, rejectionReason: "Rejected due to issues with the video", status: "Rejected" });
        generateInvoicePDF(pdfData)
            .then((pdfBuffer) => Invoice_1.default.findByIdAndUpdate(req.params.id, { status: "Rejected", pdfBuffer }, { new: true }).then((updatedInvoice) => sendInvoiceEmail(invoice.instructor.email, pdfBuffer).then(() => res.json({ message: "Invoice rejected, PDF stored, email sent" }))))
            .catch((error) => {
            console.error("PDF/email error:", error);
            res.status(500).json({ message: error.message });
        });
    })
        .catch((error) => res.status(400).json({ message: error.message }));
};
exports.rejectInvoice = rejectInvoice;
