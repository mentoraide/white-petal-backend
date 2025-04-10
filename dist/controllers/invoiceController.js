"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoice = exports.updateInvoice = exports.getInvoices = exports.getInvoiceById = exports.createInvoice = void 0;
const Invoice_1 = __importDefault(require("../models/Invoice"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const generateInvoicePDF = (invoice, filePath) => {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ margin: 50 });
        const stream = fs_1.default.createWriteStream(filePath);
        doc.pipe(stream);
        doc.fontSize(20).text("INVOICE", { align: "center" }).moveDown(1);
        doc.fontSize(14).text(`Invoice Number: ${invoice.invoiceNumber}`);
        doc.text(`Invoice Date: ${invoice.createdAt.toISOString().split("T")[0]}`);
        doc.text(`Due Date: ${invoice.dueDate.toISOString().split("T")[0]}`).moveDown(1);
        doc.fontSize(14).text("Company Details:", { underline: true });
        doc.fontSize(12).text(`${invoice.companyDetails.name}`).moveDown(0.5);
        doc.text(`${invoice.companyDetails.email}`).moveDown(0.5);
        doc.text(`${invoice.companyDetails.phone}`).moveDown(1);
        doc.fontSize(14).text("Instructor Details:", { underline: true });
        doc.fontSize(12).text(`${invoice.instructorDetails.name}`).moveDown(0.5);
        doc.text(`${invoice.instructorDetails.address}`).moveDown(0.5);
        doc.text(`${invoice.instructorDetails.email}`).moveDown(0.5);
        doc.text(`${invoice.instructorDetails.phone}`).moveDown(1);
        doc.fontSize(14).text("Services Invoiced:", { underline: true });
        invoice.services.forEach((service, index) => {
            doc.fontSize(12).text(`${index + 1}. ${service.title} | Duration: ${service.duration} | Rate: $${service.ratePerVideo} | Total: $${service.totalAmount}`);
            doc.moveDown(0.5);
        });
        doc.fontSize(14).text("Total Amount:", { underline: true });
        doc.fontSize(12).text(`Subtotal: $${invoice.subTotal}`).moveDown(0.5);
        doc.text(`Tax (${invoice.taxRate}%): $${invoice.taxAmount}`).moveDown(0.5);
        doc.text(`Discount: $${invoice.discount || 0}`).moveDown(0.5);
        doc.text(`Grand Total: $${invoice.grandTotal}`).moveDown(1);
        // Payment Details Section (with proper alignment)
        doc.fontSize(14).text("Payment Details:", { underline: true });
        doc.fontSize(12).text(`Payment Mode: ${invoice.paymentDetails.method}`).moveDown(0.5); // 0.5 line gap
        doc.text(`Bank Name: ${invoice.paymentDetails.bankName}`).moveDown(0.5); // 0.5 line gap
        doc.text(`Account Holder: ${invoice.paymentDetails.accountHolder}`).moveDown(0.5); // 0.5 line gap
        doc.text(`Account Number: ${invoice.paymentDetails.accountNumber}`).moveDown(0.5); // 0.5 line gap
        doc.text(`IFSC Code: ${invoice.paymentDetails.ifscCode}`).moveDown(0.5); // 0.5 line gap
        if (invoice.paymentDetails.upiId) {
            doc.text(`UPI ID: ${invoice.paymentDetails.upiId}`).moveDown(1); // 1 line gap
        }
        // Approval Section (with proper alignment)
        doc.fontSize(14).text("Approval Section:", { underline: true });
        doc.fontSize(12).text("Admin Signature: ________________").moveDown(0.5); // 0.5 line gap
        doc.text("Approval Status: Pending").moveDown(1); // 1 line gap
        // Notes Section (with proper alignment)
        doc.fontSize(14).text("Notes:", { underline: true });
        doc.fontSize(12).text("[Admin Remarks]").moveDown(1); // 1 line gap
        // Terms & Conditions Section (with proper alignment)
        doc.fontSize(14).text("Terms & Conditions:", { underline: true });
        doc.fontSize(12).text("1. Payment will be processed within 10 days from the invoice date.").moveDown(0.5); // 0.5 line gap
        doc.text("2. The instructor confirms all videos are original and copyright-free.").moveDown(0.5); // 0.5 line gap
        doc.text("3. Any disputes must be raised within 7 days of payment.").moveDown(0.5); // 0.5 line gap
        doc.text("4. Taxes, if applicable, are the responsibility of the instructor.").moveDown(1); // 1 line gap
        doc.end();
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
};
const createInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        res.status(401).json({ message: "Unauthorized: User not found in request" });
        return;
    }
    const { invoiceNumber, dueDate, instructorDetails, companyDetails, services, subTotal, taxRate, taxAmount, discount, grandTotal, email, paymentDetails, status, notes, videoIds, // NEW FIELD
     } = req.body;
    if (!dueDate || !instructorDetails || !companyDetails || !services ||
        subTotal === undefined || taxRate === undefined || taxAmount === undefined ||
        grandTotal === undefined || !email || !paymentDetails || !status || !videoIds) {
        res.status(400).json({ message: "All required fields must be provided" });
        return;
    }
    try {
        const lastInvoice = yield Invoice_1.default.findOne().sort({ createdAt: -1 });
        let invoiceNum = "INV-1001";
        if (lastInvoice === null || lastInvoice === void 0 ? void 0 : lastInvoice.invoiceNumber) {
            const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[1], 10);
            invoiceNum = `INV-${lastNumber + 1}`;
        }
        const invoice = yield new Invoice_1.default({
            invoiceNumber: invoiceNum,
            dueDate,
            instructor: req.user._id,
            instructorDetails,
            companyDetails,
            services,
            subTotal,
            taxRate,
            taxAmount,
            discount,
            grandTotal,
            email,
            paymentDetails,
            status,
            notes,
            videoIds, // 💾 Save video IDs in invoice
        }).save();
        // 📄 PDF generation and Email sending
        const invoicesDir = path_1.default.join(__dirname, "../public/invoices");
        if (!fs_1.default.existsSync(invoicesDir)) {
            fs_1.default.mkdirSync(invoicesDir, { recursive: true });
        }
        const filePath = path_1.default.join(invoicesDir, `${invoice._id}.pdf`);
        yield generateInvoicePDF(invoice, filePath);
        try {
            yield fs_1.default.promises.access(filePath, fs_1.default.constants.F_OK);
            invoice.pdfUrl = `${process.env.BASE_URL}/invoices/${invoice._id}.pdf`;
            yield invoice.save();
        }
        catch (_a) {
            res.status(500).json({ message: "Failed to generate the PDF invoice" });
            return;
        }
        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: invoice.email,
            subject: "Invoice Generated",
            text: "Please find your invoice attached.",
            attachments: [{ filename: "invoice.pdf", path: filePath }],
        };
        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                res.status(500).json({ message: "Invoice created but email not sent", error: err.message });
            }
            else {
                res.status(201).json({ message: "Invoice created and email sent successfully", invoice });
            }
        });
    }
    catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.createInvoice = createInvoice;
const getInvoiceById = (req, res) => {
    Invoice_1.default.findById(req.params.invoiceId)
        .then((invoice) => {
        if (!invoice) {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }
        res.status(200).json(invoice);
    })
        .catch((error) => res.status(400).json({ message: error.message }));
};
exports.getInvoiceById = getInvoiceById;
const getInvoices = (req, res) => {
    Invoice_1.default.find()
        .then((invoices) => res.status(200).json(invoices))
        .catch((error) => res.status(500).json({ message: error.message }));
};
exports.getInvoices = getInvoices;
const updateInvoice = (req, res) => {
    Invoice_1.default.findByIdAndUpdate(req.params.invoiceId, req.body, { new: true, runValidators: true })
        .then((updatedInvoice) => {
        if (!updatedInvoice) {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }
        res.status(200).json(updatedInvoice);
    })
        .catch((error) => res.status(400).json({ message: error.message }));
};
exports.updateInvoice = updateInvoice;
const deleteInvoice = (req, res) => {
    Invoice_1.default.findByIdAndDelete(req.params.invoiceId)
        .then((deletedInvoice) => {
        if (!deletedInvoice) {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }
        res.status(200).json({ message: "Invoice deleted successfully" });
    })
        .catch((error) => res.status(400).json({ message: error.message }));
};
exports.deleteInvoice = deleteInvoice;
