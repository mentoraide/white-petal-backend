"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectVideo = exports.approveVideo = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const video_1 = __importDefault(require("../models/video"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const user_1 = __importDefault(require("../models/user"));
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
const generateInvoiceNumber = (invoiceDate, sequence) => {
    const formattedDate = invoiceDate.toISOString().split("T")[0].replace(/-/g, "");
    return `INV-${formattedDate}-${sequence.toString().padStart(4, "0")}`;
};
const generateInvoicePDF = (invoice) => {
    return new Promise((resolve, reject) => {
        var _a, _b, _c, _d;
        const invoicesDir = path_1.default.join(__dirname, "../../invoices");
        if (!fs_1.default.existsSync(invoicesDir)) {
            fs_1.default.mkdirSync(invoicesDir, { recursive: true });
        }
        const invoiceNumber = generateInvoiceNumber(new Date(invoice.createdAt), invoice.sequence || 1);
        const filePath = path_1.default.join(invoicesDir, `${invoiceNumber}.pdf`);
        const stream = fs_1.default.createWriteStream(filePath);
        const doc = new pdfkit_1.default();
        doc.pipe(stream);
        // Invoice Header
        doc.fontSize(20).text("Invoice", { align: "center" });
        doc.moveDown();
        doc.fontSize(14).text(`Invoice ID: ${invoiceNumber}`, { align: "center" });
        doc.moveDown();
        doc.text("------------------------------------------------------------");
        // Company Details
        doc.text("Company Details", { underline: true });
        doc.text(`Company Name: ${((_a = invoice.admin) === null || _a === void 0 ? void 0 : _a.name) || "N/A"}`);
        doc.text(`Company Email: ${((_b = invoice.admin) === null || _b === void 0 ? void 0 : _b.email) || "N/A"}`);
        doc.moveDown();
        doc.text("Instructor Details", { underline: true });
        doc.text(`Instructor Name: ${((_c = invoice.instructor) === null || _c === void 0 ? void 0 : _c.name) || "N/A"}`);
        doc.text(`Instructor Email: ${((_d = invoice.instructor) === null || _d === void 0 ? void 0 : _d.email) || "N/A"}`);
        doc.moveDown();
        doc.fontSize(14).text("Video Details", { underline: true });
        doc.text(`courseName: ${invoice.courseName || "N/A"}`).moveDown(0.5);
        doc.text(`courseContent: ${invoice.courseContent || "N/A"}`).moveDown(0.5); // 0.5 line gap;
        doc.text(`videoUrl: ${invoice.videoUrl || "N/A"}`).moveDown(0.5);
        // doc.text(`description: ${invoice.description || "N/A"}`).moveDown(0.5); 
        doc.text(`Uploaded Date: ${new Date(invoice.createdAt).toLocaleDateString()}`).moveDown(0.5);
        doc.text(`Total Views: ${invoice.watchedBy ? invoice.watchedBy.length : 0}`).moveDown(0.5);
        doc.moveDown();
        // Approval Section
        if (invoice.status === "Approved") {
            doc.text("Status: Approved", { underline: true });
            doc.text(`Approval Date: ${invoice.approvalDate ? invoice.approvalDate.toLocaleDateString() : "N/A"}`);
        }
        else if (invoice.status === "Rejected") {
            doc.text("Status: Rejected", { underline: true });
            doc.text(`Rejection Date: ${invoice.rejectionDate ? invoice.rejectionDate.toLocaleDateString() : "N/A"}`);
            doc.text(`Rejection Reason: ${invoice.rejectionReason || "Rejected due to issues with the video and money"}`);
        }
        else {
            // Optionally handle cases where the status is neither Approved or Rejected
            doc.text("Status: Pending", { underline: true });
        }
        // Notes Section (with proper alignment)
        doc.fontSize(14).text("Notes:", { underline: true });
        doc.fontSize(12).text("[Admin Remarks]").moveDown(1); // 1 line gap
        doc.end();
        stream.on("finish", () => resolve(filePath));
        stream.on("error", (err) => reject(err));
    });
};
const sendInvoiceEmail = (email, invoicePath) => {
    if (!email) {
        throw new Error("Email is required for sending invoices");
    }
    transporter.sendMail({
        from: process.env.SMTP_MAIL,
        to: email,
        subject: "Your Invoice",
        text: "Please find attached your invoice.",
        attachments: [{ filename: "invoice.pdf", path: invoicePath }],
    }).catch((error) => {
        console.error("Error sending email:", error);
    });
};
const approveVideo = (req, res) => {
    video_1.default.findById(req.params.id)
        .populate("uploadedBy", "name email")
        .then((video) => {
        if (!video || !video.uploadedBy) {
            res.status(404).json({ message: "Video or instructor details not found" });
            return;
        }
        user_1.default.findOne()
            .then((admin) => {
            const email = video.uploadedBy.email;
            video_1.default.findByIdAndUpdate(req.params.id, {
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
                        name: updatedVideo.uploadedBy.name || "N/A",
                        email: email || "N/A"
                    },
                    companyDetails: {
                        name: (admin === null || admin === void 0 ? void 0 : admin.name) || "N/A",
                        email: (admin === null || admin === void 0 ? void 0 : admin.email) || "N/A"
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
exports.approveVideo = approveVideo;
const rejectVideo = (req, res) => {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
        res.status(400).json({ message: "Rejection reason is required" });
        return;
    }
    video_1.default.findById(req.params.id)
        .populate("uploadedBy", "name email")
        .then((video) => {
        if (!video || !video.uploadedBy) {
            res.status(404).json({ message: "Video or instructor details not found" });
            return;
        }
        user_1.default.findOne()
            .then((admin) => {
            if (!admin) {
                res.status(500).json({ message: "Admin details not found" });
                return;
            }
            const email = video.uploadedBy.email;
            video_1.default.findByIdAndUpdate(req.params.id, {
                status: "rejected",
                rejectionReason,
                rejectionDate: new Date()
            }, { new: true })
                .then((updatedVideo) => {
                if (!updatedVideo) {
                    res.status(400).json({ message: "Video update failed" });
                    return;
                }
                const invoiceData = {
                    createdAt: updatedVideo.createdAt,
                    instructor: {
                        name: updatedVideo.uploadedBy.name || "N/A",
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
exports.rejectVideo = rejectVideo;
