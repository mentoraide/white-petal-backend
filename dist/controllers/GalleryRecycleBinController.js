"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.permanentDeleteImage = exports.restoreImage = exports.getAllRecycleItems = void 0;
const GalleryRecyclebin_1 = __importDefault(require("../models/GalleryRecyclebin"));
const Gallery_1 = __importDefault(require("../models/Gallery"));
// GET all recycled images
const getAllRecycleItems = (req, res) => {
    GalleryRecyclebin_1.default.find()
        .populate("uploadedBy", "name email")
        .then((items) => res.json({ items }))
        .catch((err) => res.status(500).json({ message: err.message }));
};
exports.getAllRecycleItems = getAllRecycleItems;
// POST: Restore image from recycle bin
const restoreImage = (req, res) => {
    GalleryRecyclebin_1.default.findById(req.params.id)
        .then((item) => {
        if (!item) {
            return res.status(404).json({ message: "Recycle item not found" });
        }
        const restored = new Gallery_1.default({
            imageUrl: item.imageUrl,
            title: item.title,
            schoolName: item.schoolName,
            uploadedBy: item.uploadedBy,
            approved: item.approved,
        });
        restored
            .save()
            .then(() => GalleryRecyclebin_1.default.findByIdAndDelete(req.params.id).then(() => {
            res.json({ message: "Image restored", restored });
        }))
            .catch((err) => res.status(500).json({ message: "Restore failed", error: err }));
    })
        .catch((err) => res.status(500).json({ message: "Restore lookup failed", error: err }));
};
exports.restoreImage = restoreImage;
// DELETE: Permanently delete a recycled image
const permanentDeleteImage = (req, res) => {
    GalleryRecyclebin_1.default.findById(req.params.id)
        .then((item) => {
        if (!item) {
            return res.status(404).json({ message: "Recycle item not found" });
        }
        item
            .deleteOne()
            .then(() => res.json({ message: "Image permanently deleted" }))
            .catch((err) => res.status(500).json({ message: "Permanent delete failed", error: err }));
    })
        .catch((err) => res.status(500).json({ message: "Delete lookup failed", error: err }));
};
exports.permanentDeleteImage = permanentDeleteImage;
