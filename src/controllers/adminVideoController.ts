import nodemailer from "nodemailer";
import { Request, Response } from "express";
import VideoModel from "../models/video";
import PDFDocument from "pdfkit";
import AdminModel from "../models/user";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

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

const generateInvoiceNumber = (invoiceDate: Date, sequence: number): string => {
    const formattedDate = invoiceDate.toISOString().split("T")[0].replace(/-/g, "");
    return `INV-${formattedDate}-${sequence.toString().padStart(4, "0")}`;
};

const generateInvoicePDF = (invoice: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        const invoiceNumber = generateInvoiceNumber(new Date(invoice.createdAt), invoice.sequence || 1);

        // Invoice Header
        doc.fontSize(20).text("Invoice", { align: "center" });
        doc.moveDown();
        doc.fontSize(14).text(`Invoice ID: ${invoiceNumber}`, { align: "center" });
        doc.moveDown();
        doc.text("------------------------------------------------------------");

        // Company Details
        doc.text("Company Details", { underline: true });
        doc.text(`Company Name: ${invoice.admin?.name || "N/A"}`);
        doc.text(`Company Email: ${invoice.admin?.email || "N/A"}`);
        doc.moveDown();

        doc.text("Instructor Details", { underline: true });
        doc.text(`Instructor Name: ${invoice.instructor?.name || "N/A"}`);
        doc.text(`Instructor Email: ${invoice.instructor?.email || "N/A"}`);
        doc.moveDown();

        doc.fontSize(14).text("Video Details", { underline: true });
        doc.text(`courseName: ${invoice.courseName || "N/A"}`).moveDown(0.5); 
        doc.text(`courseContent: ${invoice.courseContent || "N/A"}`).moveDown(0.5);
        doc.text(`videoUrl: ${invoice.videoUrl || "N/A"}`).moveDown(0.5);
        doc.text(`Uploaded Date: ${new Date(invoice.createdAt).toLocaleDateString()}`).moveDown(0.5);
        doc.text(`Total Views: ${invoice.watchedBy ? invoice.watchedBy.length : 0}`).moveDown();

        // Approval Section
        if (invoice.status === "Approved") {
            doc.text("Status: Approved", { underline: true }); 
            doc.text(`Approval Date: ${invoice.approvalDate ? invoice.approvalDate.toLocaleDateString() : "N/A"}`);
        } else if (invoice.status === "Rejected") {
            doc.text("Status: Rejected", { underline: true }); 
            doc.text(`Rejection Date: ${invoice.rejectionDate ? invoice.rejectionDate.toLocaleDateString() : "N/A"}`);
            doc.text(`Rejection Reason: ${invoice.rejectionReason || "Rejected due to issues with the video and money"}`);
        } else {
            doc.text("Status: Pending", { underline: true }); 
        }

        // Notes Section
        doc.fontSize(14).text("Notes:", { underline: true });
        doc.fontSize(12).text("[Admin Remarks]").moveDown(1); 

        doc.end();
    });
};


const sendInvoiceEmail = (email: string, pdfBuffer: Buffer): void => {
    if (!email) {
        throw new Error("Email is required for sending invoices");
    }
    transporter.sendMail({
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
    }).catch((error) => {
        console.error("Error sending email:", error);
    });
};

export const approveVideo = (req: Request, res: Response): void => {
    VideoModel.findById(req.params.id)
        .populate("uploadedBy", "name email")
        .then((video) => {
            if (!video || !video.uploadedBy) {
                res.status(404).json({ message: "Video or instructor details not found" });
                return;
            }
            AdminModel.findOne()
                .then((admin) => {
                    const email = (video.uploadedBy as any).email;
                    VideoModel.findByIdAndUpdate(req.params.id, {
                        status: "approved",
                        rejectionReason: "N/A",
                        rejectionDate: null
                    }, { new: true })
                        .then((updatedVideo) => {
                            if (!updatedVideo) {
                                res.status(400).json({ message: "Video update failed" });
                                return;
                            }
                            const invoiceData = {
                                createdAt: updatedVideo.createdAt,
                                instructor: {
                                    name: (updatedVideo.uploadedBy as any).name || "N/A",
                                    email: email || "N/A"
                                },
                                companyDetails: {
                                    name: admin?.name || "N/A",
                                    email: admin?.email || "N/A"
                                },
                                courseName: updatedVideo.courseName,
                                courseContent: updatedVideo.courseContent,
                                videoUrl: updatedVideo.videoUrl,
                                description: updatedVideo.description,
                                status: "Approved",
                                approvalDate: new Date(),
                                sequence: updatedVideo.sequence || 1
                            };
                            generateInvoicePDF(invoiceData)
                                .then((invoicePath) => {
                                    sendInvoiceEmail(email, invoicePath);
                                    res.json({ message: "Video approved and invoice sent" });
                                })
                                .catch((error) => res.status(500).json({ message: error.message }));
                        })
                        .catch((error) => res.status(500).json({ message: error.message }));
                })
                .catch((error) => res.status(500).json({ message: "Failed to fetch admin details" }));
        })
        .catch((error) => res.status(400).json({ message: error.message }));
};

export const rejectVideo = (req: Request, res: Response): void => {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
        res.status(400).json({ message: "Rejection reason is required" });
        return;
    }

    VideoModel.findById(req.params.id)
        .populate("uploadedBy", "name email")
        .then((video) => {
            if (!video || !video.uploadedBy) {
                res.status(404).json({ message: "Video or instructor details not found" });
                return;
            }

            AdminModel.findOne()
                .then((admin) => {
                    if (!admin) {
                        res.status(500).json({ message: "Admin details not found" });
                        return;
                    }

                    const email = (video.uploadedBy as any).email;
                    
                    VideoModel.findByIdAndUpdate(
                        req.params.id,
                        {
                            status: "rejected",
                            rejectionReason,
                            rejectionDate: new Date()
                        },
                        { new: true }
                    )
                    .then((updatedVideo) => {
                        if (!updatedVideo) {
                            res.status(400).json({ message: "Video update failed" });
                            return;
                        }


                        const invoiceData = {
                            createdAt: updatedVideo.createdAt,
                            instructor: {
                                name: (updatedVideo.uploadedBy as any).name || "N/A",
                                email: email || "N/A"
                            },
                            companyDetails: {
                                name: admin.name || "N/A",
                                email: admin.email || "N/A",
                            },
                            courseName: updatedVideo.courseName,
                            courseContent: updatedVideo.courseContent,
                            videoUrl: updatedVideo.videoUrl,
                            description: updatedVideo.description,
                            status: "Rejected",
                            rejectionDate: new Date(),
                            rejectionReason,
                            sequence: updatedVideo.sequence || 1
                        };

                        generateInvoicePDF(invoiceData)
                            .then((invoicePath) => {
                                sendInvoiceEmail(email, invoicePath);
                                res.json({ message: "Video rejected and invoice sent" });
                            })
                            .catch((error) => {
                                res.status(500).json({ message: error.message });
                            });
                    })
                    .catch((error) => {
                        res.status(500).json({ message: error.message });
                    });
                })
                .catch((error) => {
                    res.status(500).json({ message: "Failed to fetch admin details" });
                });
        })
        .catch((error) => {
            res.status(400).json({ message: error.message });
        });
};
