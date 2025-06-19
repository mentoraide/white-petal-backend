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
exports.permanentDeleteLibraryVideo = exports.restoreLibraryVideo = exports.getAllLibraryRecycleItems = void 0;
const LibraryVideoRecycleBinModel_1 = __importDefault(require("../models/LibraryVideoRecycleBinModel"));
const LibraryBook_1 = __importDefault(require("../models/LibraryBook")); // Main model
const getAllLibraryRecycleItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield LibraryVideoRecycleBinModel_1.default.find().populate("uploadedBy", "name email");
        res.status(200).json(items);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAllLibraryRecycleItems = getAllLibraryRecycleItems;
const restoreLibraryVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield LibraryVideoRecycleBinModel_1.default.findById(req.params.id);
        if (!item) {
            res.status(404).json({ message: "Recycle item not found" });
            return;
        }
        const restoredVideo = new LibraryBook_1.default({
            originalVideoId: item._id,
            title: item.title,
            author: item.author,
            subject: item.subject,
            keywords: item.keywords,
            videoUrl: item.videoUrl, // Ensure this field is populated
            coverImage: item.coverImage,
            description: item.description,
            uploadedBy: item.uploadedBy,
            approved: item.approved,
            deletedAt: new Date(),
        });
        yield restoredVideo.save();
        yield LibraryVideoRecycleBinModel_1.default.findByIdAndDelete(item._id);
        res
            .status(200)
            .json({ message: "Video restored successfully", restoredVideo });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.restoreLibraryVideo = restoreLibraryVideo;
const permanentDeleteLibraryVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield LibraryVideoRecycleBinModel_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            res.status(404).json({ message: "Recycle item not found" });
            return;
        }
        res
            .status(200)
            .json({ message: "Library video permanently deleted from Recycle Bin" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.permanentDeleteLibraryVideo = permanentDeleteLibraryVideo;
