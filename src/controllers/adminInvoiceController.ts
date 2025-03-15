import { Request, Response } from "express";
import InvoiceModel from "../models/Invoice";
import PDFDocument from "pdfkit"; 
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Generate invoice number based on the date and sequence
const generateInvoiceNumber = (invoiceDate: Date, sequence: number): string => {
    const formattedDate = invoiceDate.toISOString().split("T")[0].replace(/-/g, "");
    return `INV-${formattedDate}-${sequence.toString().padStart(4, "0")}`;
};

// Generate invoice PDF with added details
const generateInvoicePDF = (invoice: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        const invoicesDir = path.join(__dirname, "../../invoices");

        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const invoiceNumber = generateInvoiceNumber(new Date(invoice.createdAt), invoice.sequence || 1);
        const filePath = path.join(invoicesDir, `${invoiceNumber}.pdf`);
        const stream = fs.createWriteStream(filePath);
        const doc = new PDFDocument();

        doc.pipe(stream);

        // Invoice Header
        doc.fontSize(20).text("Invoice", { align: "center" });
        doc.moveDown();
        doc.fontSize(14).text(`Invoice ID: ${invoiceNumber}`, { align: "center" });
        doc.moveDown();
        doc.text("------------------------------------------------------------");

        // Company Details
        doc.text("Company Details", { underline: true });
        doc.text(`Company Name: ${invoice.companyDetails?.name || "N/A"}`);
        doc.text(`Company Email: ${invoice.companyDetails?.email || "N/A"}`);
        doc.text(`Company Address: ${invoice.companyDetails?.address || "N/A"}`);
        doc.text(`Company Phone: ${invoice.companyDetails?.phone || "N/A"}`);
        doc.moveDown();

        // Instructor Details
        doc.text("Instructor Details", { underline: true });
        doc.text(`Instructor Name: ${invoice.instructor?.name || "N/A"}`);
        doc.text(`Instructor Email: ${invoice.instructor?.email || "N/A"}`);
        doc.moveDown();

        // Services Provided (Courses/Services)
        doc.text("Services Provided", { underline: true });
        if (invoice.services && Array.isArray(invoice.services) && invoice.services.length > 0) {
            invoice.services.forEach((service: any, index: number) => {
                const title = service.title ? service.title : "N/A";
                const totalAmount = service.totalAmount ? `$${service.totalAmount.toFixed(2)}` : "$0.00";

                // Separator line before each service (except the first one)
                if (index > 0) {
                    doc.moveDown(0.5); // Small space before the separator
                    doc.text("----------------------------------------");
                    doc.moveDown(0.5); // Small space after the separator
                }

                // Service details
                doc.text(`${index + 1}. ${title} - Amount: ${totalAmount}`);
            });
        } else {
            doc.text("No services available.");
        }

        doc.moveDown();


        // Payment Summary
        doc.text("Payment Summary", { underline: true });
        doc.fontSize(14).text("Total Amount:", { underline: true });
        doc.fontSize(12).text(`Subtotal: $${invoice.subTotal}`).moveDown(0.5); 
        doc.text(`Tax (${invoice.taxRate}%): $${invoice.taxAmount}`).moveDown(0.5); // 0.5 line gap
        doc.text(`Discount: $${invoice.discount || 0}`).moveDown(0.5); 
        doc.text(`Grand Total: $${invoice.grandTotal}`).moveDown(1); // 1 line gap

        // Payment Details
        doc.text("Payment Details", { underline: true });
        doc.text(`Payment Method: ${invoice.paymentMethod || "N/A"}`);
        doc.text(`Payment Status: ${invoice.paymentStatus || "N/A"}`);
        doc.text(`Payment Date: ${invoice.paymentDate ? invoice.paymentDate.toLocaleDateString() : "N/A"}`);
        doc.moveDown();

        // Approval Section
        if (invoice.status === "Approved") {
            doc.text("Status: Approved", { underline: true }); 
            doc.text(`Approval Date: ${invoice.approvalDate ? invoice.approvalDate.toLocaleDateString() : "N/A"}`);
        } else if (invoice.status === "Rejected") {
            doc.text("Status: Rejected", { underline: true }); 
            doc.text(`Rejection Date: ${invoice.rejectionDate ? invoice.rejectionDate.toLocaleDateString() : "N/A"}`);
            doc.text(`Rejection Reason: ${invoice.rejectionReason || "Rejected due to issues with the video and money"}`);
        } else {
            // Optionally handle cases where the status is neither Approved or Rejected
            doc.text("Status: Pending", { underline: true }); // If the status is pending or undefined
        }

        // Notes Section 
        doc.fontSize(14).text("Notes:", { underline: true });
        doc.fontSize(12).text("[Admin Remarks]").moveDown(1); 

        doc.end();

        stream.on("finish", () => resolve(filePath));
        stream.on("error", (err) => reject(err));
    });
};

// Send invoice email
const sendInvoiceEmail = (email: string, invoicePath: string): Promise<void> => {
    if (!email) {
        return Promise.reject(new Error("Email is required for sending invoices"));
    }

    return transporter.sendMail({
        from: process.env.SMTP_MAIL,
        to: email,
        subject: "Your Invoice",
        text: "Please find attached your invoice.",
        attachments: [{ filename: "invoice.pdf", path: invoicePath }],
    }).then(() => { });
};

// Approve invoice and send email
export const approveInvoice = (req: Request, res: Response) => {
    InvoiceModel.findById(req.params.id)
        .populate<{ instructor: { name: string, email: string } }>("instructor", "name email")
        .then((invoice) => {
            if (!invoice) return res.status(404).json({ message: "Invoice not found" });

            if (!invoice.instructor || typeof invoice.instructor !== "object" || !("email" in invoice.instructor)) {
                return res.status(400).json({ message: "Instructor details missing in invoice" });
            }
            const approvalDate = new Date(); 

            const pdfData = {
                ...invoice.toObject(),
                approvalDate: approvalDate,
                status: "Approved", 
            };

            // Approve the invoice without storing approvalDate in DB
            InvoiceModel.findByIdAndUpdate(req.params.id, { status: "Approved" }, { new: true })
                .then((updatedInvoice) => {
                    if (!updatedInvoice) {
                        return res.status(400).json({ message: "Invoice update failed" });
                    }

                    generateInvoicePDF(pdfData)
                        .then((invoicePath) => sendInvoiceEmail(invoice.instructor.email, invoicePath))
                        .then(() => res.json({ message: "Invoice approved and email sent" }))
                        .catch((error) => {
                            res.status(500).json({ message: error.message });
                        });
                })
                .catch((error) => res.status(400).json({ message: error.message }));
        })
        .catch((error) => res.status(400).json({ message: error.message }));
};

// Reject invoice and send email
export const rejectInvoice = (req: Request, res: Response) => {
    InvoiceModel.findById(req.params.id)
        .populate<{ instructor: { name: string, email: string } }>("instructor", "name email")
        .then((invoice) => {
            if (!invoice) return res.status(404).json({ message: "Invoice not found" });

            if (!invoice.instructor || typeof invoice.instructor !== "object" || !("email" in invoice.instructor)) {
                return res.status(400).json({ message: "Instructor details missing in invoice" });
            }

            // Set rejection date dynamically but don't store it in the database
            const rejectionDate = new Date(); // Get the current date for rejection

            // invoice details for PDF generation
            const pdfData = {
                ...invoice.toObject(),
                rejectionDate: rejectionDate, 
                rejectionReason: "Rejected due to issues with the video",
                status: "Rejected", // Set the status dynamically to Rejected
            };

            // Reject the invoice without storing rejectionDate or rejectionReason in DB
            InvoiceModel.findByIdAndUpdate(req.params.id, { status: "Rejected" }, { new: true })
                .then((updatedInvoice) => {
                    if (!updatedInvoice) {
                        return res.status(400).json({ message: "Invoice update failed" });
                    }

                    generateInvoicePDF(pdfData)
                        .then((invoicePath) => sendInvoiceEmail(invoice.instructor.email, invoicePath))
                        .then(() => res.json({ message: "Invoice rejected and email sent" }))
                        .catch((error) => {
                            console.error("Error during PDF generation or email sending:", error);
                            res.status(500).json({ message: error.message });
                        });
                })
                .catch((error) => res.status(400).json({ message: error.message }));
        })
        .catch((error) => res.status(400).json({ message: error.message }));
};
