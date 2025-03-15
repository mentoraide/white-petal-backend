"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingImages = exports.deleteImage = exports.updateImage = exports.getGallery = exports.rejectImage = exports.approveImage = exports.uploadImage = void 0;
const Cloundinary_1 = __importDefault(require("../lib/Utils/Cloundinary"));
const Gallery_1 = __importDefault(require("../models/Gallery"));
const fs_1 = __importDefault(require("fs"));
/**
 * Upload Image (Now accepts image URL)
 */
// export const uploadImage = (req: AuthRequest, res: Response): void => {
//   const { imageUrl, title, schoolName } = req.body;
//   if (!imageUrl || !title || !schoolName) {
//     res
//       .status(400)
//       .json({ message: "Image URL, title, and school name are required." });
//   }
//   if (!req.user || !req.user.id) {
//     res.status(403).json({ message: "Unauthorized: User must be logged in." });
//   }
//   Gallery.create({
//     imageUrl,
//     title,
//     schoolName,
//     uploadedBy: req.user!.id,
//   })
//     .then((image) =>
//       res.status(201).json({ message: "Image uploaded successfully.", image })
//     )
//     .catch((err) =>
//       res.status(500).json({ message: "Upload failed.", error: err })
//     );
// };
const uploadImage = (req, res) => {
    if (!req.file || !req.body.title || !req.body.schoolName) {
        res
            .status(400)
            .json({ message: "file, title, and schoolName are required" });
        return;
    }
    if (!req.user || !req.user._id) {
        res.status(403).json({ message: "Unauthorized: User must be logged in" });
        return;
    }
    Cloundinary_1.default.uploader
        .upload(req.file.path)
        .then((result) => {
        var _a;
        fs_1.default.unlinkSync(req.file.path);
        return Gallery_1.default.create({
            imageUrl: result.secure_url,
            title: req.body.title,
            schoolName: req.body.schoolName,
            uploadedBy: req.user.id || ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id), // ✅ FIX: `req.user!._id` since we've checked `req.user` exists
        });
    })
        .then((image) => res.status(201).json({ message: "Image uploaded", image }))
        .catch((err) => res.status(500).json({ message: "Upload failed", error: err }));
};
exports.uploadImage = uploadImage;
/**
 * Approve Image - Admin only
 */
const approveImage = (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        res
            .status(403)
            .json({ message: "Unauthorized: Only admins can approve images." });
    }
    Gallery_1.default.findByIdAndUpdate(req.params.id, { approved: true }, { new: true })
        .then((image) => {
        if (!image)
            return res.status(404).json({ message: "Image not found." });
        res.json({ message: "Image approved.", image });
    })
        .catch((err) => res.status(500).json({ message: "Approval failed.", error: err }));
};
exports.approveImage = approveImage;
/**
 * Reject Image - Admin only
 */
const rejectImage = (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        res
            .status(403)
            .json({ message: "Unauthorized: Only admins can reject images." });
        return;
    }
    Gallery_1.default.findByIdAndUpdate(req.params.id, { approved: false }, { new: true })
        .then((image) => {
        if (!image)
            return res.status(404).json({ message: "Image not found." });
        res.json({ message: "Image rejected.", image });
    })
        .catch((err) => res.status(500).json({ message: "Rejection failed.", error: err }));
};
exports.rejectImage = rejectImage;
/**
 * Get Gallery - Public access
 */
const getGallery = (req, res) => {
    const sortBy = req.query.sortBy === "newest" ? "-createdAt" : "createdAt";
    Gallery_1.default.find({ approved: true })
        .sort(sortBy)
        .populate("uploadedBy", "name email")
        .then((images) => res.json({ images }))
        .catch((err) => res.status(500).json({ message: "Error fetching images.", error: err }));
};
exports.getGallery = getGallery;
/*** Update Image - Requires authentication */
const updateImage = (req, res) => {
    const { imageUrl, title, schoolName } = req.body;
    if (!imageUrl && !title && !schoolName) {
        res.status(400).json({ message: "No data provided for update." });
    }
    Gallery_1.default.findByIdAndUpdate(req.params.id, { imageUrl, title, schoolName }, { new: true })
        .then((updatedImage) => {
        if (!updatedImage)
            return res.status(404).json({ message: "Image not found." });
        res.json({ message: "Image updated successfully.", image: updatedImage });
    })
        .catch((err) => res.status(500).json({ message: "Update failed.", error: err }));
};
exports.updateImage = updateImage;
/**
 * Delete Image - Requires authentication
 */
const deleteImage = (req, res) => {
    Gallery_1.default.findByIdAndDelete(req.params.id)
        .then((image) => {
        if (!image)
            return res.status(404).json({ message: "Image not found." });
        res.json({ message: "Image deleted successfully." });
    })
        .catch((err) => res.status(500).json({ message: "Delete failed.", error: err }));
};
exports.deleteImage = deleteImage;
const getPendingImages = (req, res) => {
    const sortBy = req.query.sortBy === "newest" ? "-createdAt" : "createdAt";
    Gallery_1.default.find({ approved: false })
        .sort(sortBy)
        .populate("uploadedBy", "name email")
        .then((images) => res.json({ images }))
        .catch((err) => res
        .status(500)
        .json({ message: "Error fetching pending images images.", error: err }));
};
exports.getPendingImages = getPendingImages;
