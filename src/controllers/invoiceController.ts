import { Request, Response } from "express";
import InvoiceModel from "../models/Invoice";
import { IUser } from "../models/user";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import VideoModel from "../models/video";
<<<<<<< HEAD
import { Readable } from "stream";
import cloudinary from "../lib/Utils/Cloundinary";

=======
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../lib/Utils/s3";
import { v4 as uuidv4 } from "uuid";
>>>>>>> main

dotenv.config();

interface AuthRequest extends Request {
    user?: IUser;
}

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

const generateInvoicePDF = (invoice: any): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Uint8Array[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });

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
        invoice.services.forEach((service: any, index: number) => {
            doc.fontSize(12).text(
                `${index + 1}. ${service.title} | Duration: ${service.duration} | Rate: $${service.ratePerVideo} | Total: $${service.totalAmount}`
            ).moveDown(0.5);
        });

        doc.fontSize(14).text("Total Amount:", { underline: true });
        doc.fontSize(12).text(`Subtotal: $${invoice.subTotal}`).moveDown(0.5);
        doc.text(`Tax (${invoice.taxRate}%): $${invoice.taxAmount}`).moveDown(0.5);
        doc.text(`Discount: $${invoice.discount || 0}`).moveDown(0.5);
        doc.text(`Grand Total: $${invoice.grandTotal}`).moveDown(1);

        doc.fontSize(14).text("Payment Details:", { underline: true });
        doc.fontSize(12).text(`Payment Mode: ${invoice.paymentDetails.method}`).moveDown(0.5);
        doc.text(`Bank Name: ${invoice.paymentDetails.bankName}`).moveDown(0.5);
        doc.text(`Account Holder: ${invoice.paymentDetails.accountHolder}`).moveDown(0.5);
        doc.text(`Account Number: ${invoice.paymentDetails.accountNumber}`).moveDown(0.5);
        doc.text(`IFSC Code: ${invoice.paymentDetails.ifscCode}`).moveDown(0.5);
        if (invoice.paymentDetails.upiId) {
            doc.text(`UPI ID: ${invoice.paymentDetails.upiId}`).moveDown(1);
        }

        doc.fontSize(14).text("Approval Section:", { underline: true });
        doc.fontSize(12).text("Admin Signature: ________________").moveDown(0.5);
        doc.text("Approval Status: Pending").moveDown(1);

        doc.fontSize(14).text("Notes:", { underline: true });
        doc.fontSize(12).text("[Admin Remarks]").moveDown(1);

        doc.fontSize(14).text("Terms & Conditions:", { underline: true });
        doc.fontSize(12).text("1. Payment will be processed within 10 days from the invoice date.").moveDown(0.5);
        doc.text("2. The instructor confirms all videos are original and copyright-free.").moveDown(0.5);
        doc.text("3. Any disputes must be raised within 7 days of payment.").moveDown(0.5);
        doc.text("4. Taxes, if applicable, are the responsibility of the instructor.").moveDown(1);

        doc.end();
    });
};

const uploadInvoiceToS3 = async (buffer: Buffer, fileName: string): Promise<string> => {
    const key = `invoices/${Date.now()}-${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: "application/pdf",
    });

    await s3.send(command);

    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user._id) {
        res.status(401).json({ message: "Unauthorized: User not found in request" });
        return;
    }

    const {
        dueDate,
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
        videoIds,
    } = req.body;

    if (!dueDate || !instructorDetails || !companyDetails || !services ||
        subTotal === undefined || taxRate === undefined || taxAmount === undefined ||
        grandTotal === undefined || !email || !paymentDetails || !status || !videoIds) {
        res.status(400).json({ message: "All required fields must be provided" });
        return;
    }

    try {
        const lastInvoice = await InvoiceModel.findOne().sort({ createdAt: -1 });
        let invoiceNum = "INV-1001";
        if (lastInvoice?.invoiceNumber) {
            const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[1], 10);
            invoiceNum = `INV-${lastNumber + 1}`;
        }

        const invoice = await new InvoiceModel({
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
            videoIds,
        }).save();

        const pdfBuffer = await generateInvoicePDF(invoice);

<<<<<<< HEAD
        // Upload to Cloudinary with .pdf extension for download support
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "invoices",
                resource_type: "raw",
                public_id: `invoice-${invoice.invoiceNumber}.pdf`, // Add .pdf for download
            },
            async (error, result) => {
                if (error || !result) {
                    console.error("Cloudinary upload failed:", error);
                    res.status(500).json({ message: "PDF upload failed" });
                    return;
                }

                invoice.pdfUrl = result.secure_url;
                await invoice.save();

                const mailOptions = {
                    from: process.env.SMTP_MAIL,
                    to: invoice.email,
                    subject: "Invoice Generated",
                    html: `<p>Your invoice is ready. <a href="${result.secure_url}" target="_blank" download>Download Invoice</a></p>`,
                };

                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        res.status(500).json({ message: "Invoice created but email not sent", error: err.message });
                    } else {
                        res.status(201).json({
                            message: "Invoice created, uploaded to Cloudinary, and email sent",
                            invoice,
                        });
                    }
                });
=======
        const invoiceUrl = await uploadInvoiceToS3(pdfBuffer, "invoice.pdf");

        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: invoice.email,
            subject: "Invoice Generated",
            text: "Please find your invoice attached.",
            attachments: [{ filename: "invoice.pdf", content: pdfBuffer }],
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                res.status(500).json({ message: "Invoice created but email not sent", error: err.message });
            } else {
                res.status(201).json({ message: "Invoice created, email sent, and uploaded to S3", invoice, invoiceUrl });
>>>>>>> main
            }
        );

        const readable = new Readable();
        readable.push(pdfBuffer);
        readable.push(null);
        readable.pipe(uploadStream);

    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const getInvoiceById = (req: AuthRequest, res: Response): void => {
    InvoiceModel.findById(req.params.invoiceId)
        .then((invoice) => {
            if (!invoice) {
                res.status(404).json({ message: "Invoice not found" });
                return;
            }
            res.status(200).json(invoice);
        })
        .catch((error) => res.status(400).json({ message: error.message }));
};

export const getInvoices = (req: AuthRequest, res: Response): void => {
    InvoiceModel.find()
        .then((invoices) => res.status(200).json(invoices))
        .catch((error) => res.status(500).json({ message: error.message }));
};

export const updateInvoice = (req: AuthRequest, res: Response): void => {
    InvoiceModel.findByIdAndUpdate(req.params.invoiceId, req.body, { new: true, runValidators: true })
        .then((updatedInvoice) => {
            if (!updatedInvoice) {
                res.status(404).json({ message: "Invoice not found" });
                return;
            }
            res.status(200).json(updatedInvoice);
        })
        .catch((error) => res.status(400).json({ message: error.message }));
};

export const deleteInvoice = (req: AuthRequest, res: Response): void => {
    InvoiceModel.findByIdAndDelete(req.params.invoiceId)
        .then((deletedInvoice) => {
            if (!deletedInvoice) {
                res.status(404).json({ message: "Invoice not found" });
                return;
            }
            res.status(200).json({ message: "Invoice deleted successfully" });
        })
        .catch((error) => res.status(400).json({ message: error.message }));
};

// ✅ New function to generate & serve PDF for download
export const getInvoicePDF = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const invoice = await InvoiceModel.findById(req.params.invoiceId);
        if (!invoice) {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }

        const pdfBuffer = await generateInvoicePDF(invoice);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating invoice PDF:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
