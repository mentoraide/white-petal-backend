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
exports.permanentDeleteVideo = exports.restoreVideo = exports.getAllRecycleItems = void 0;
const recycleBin_1 = __importDefault(require("../models/recycleBin"));
const video_1 = __importDefault(require("../models/video"));
// Get All Recycle Bin Videos
const getAllRecycleItems = (req, res) => {
    recycleBin_1.default.find()
        .populate("uploadedBy", "name email")
        .then((items) => res.json(items))
        .catch((err) => res.status(500).json({ message: err.message }));
};
exports.getAllRecycleItems = getAllRecycleItems;
// Restore Video
const restoreVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield recycleBin_1.default.findById(req.params.id);
        if (!item) {
            res.status(404).json({ message: "Recycle item not found" });
            return;
        }
        const restoredVideo = new video_1.default({
            courseName: item.courseName,
            courseContent: item.courseContent,
            videoUrl: item.videoUrl,
            thumbnailUrl: item.thumbnailUrl,
            uploadedBy: item.uploadedBy,
            description: item.description,
            status: item.status,
            watchedBy: [],
        });
        yield restoredVideo.save();
        yield recycleBin_1.default.findByIdAndDelete(item._id);
        res.status(200).json({ message: "Video restored successfully", restoredVideo });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.restoreVideo = restoreVideo;
// Permanently Delete Video from Recycle Bin
const permanentDeleteVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield recycleBin_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            res.status(404).json({ message: "Recycle item not found" });
            return;
        }
        res.status(200).json({ message: "Video permanently deleted from Recycle Bin" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.permanentDeleteVideo = permanentDeleteVideo;
