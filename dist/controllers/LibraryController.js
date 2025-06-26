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
exports.deleteLibraryVideo = exports.getAllLibraryVideo = exports.getLibraryVideoById = exports.getLibraryVideo = exports.updateLibraryVideo = exports.uploadLibraryVideo = void 0;
const LibraryBook_1 = __importDefault(require("../models/LibraryBook"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const LibraryVideoRecycleBinModel_1 = __importDefault(require("../models/LibraryVideoRecycleBinModel"));
// 📌 Upload Library Video
const uploadLibraryVideo = (req, res) => {
    var _a, _b;
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return Promise.resolve();
    }
    const { title, author, subject, keywords, description } = req.body;
    const videoFile = req.files && ((_a = req.files.video) === null || _a === void 0 ? void 0 : _a[0]);
    const coverImageFile = req.files && ((_b = req.files.coverImage) === null || _b === void 0 ? void 0 : _b[0]);
    if (!videoFile || !coverImageFile) {
        res.status(400).json({ error: "Both video and cover image are required." });
        return Promise.resolve();
    }
    return Promise.all([
        cloudinary_1.default.v2.uploader.upload(videoFile.path, { resource_type: 'video', folder: 'library_videos' }),
        cloudinary_1.default.v2.uploader.upload(coverImageFile.path, { folder: 'library_books/covers' })
    ])
        .then(([videoResult, coverImageResult]) => {
        if (!videoResult.secure_url || !coverImageResult.secure_url) {
            throw new Error("File upload to Cloudinary failed");
        }
        const newVideo = new LibraryBook_1.default({
            title,
            author,
            subject,
            keywords: keywords ? keywords.split(',').map((k) => k.trim().toLowerCase()) : [],
            description,
            videoUrl: videoResult.secure_url,
            coverImage: coverImageResult.secure_url,
            uploadedBy: req.user.id,
            isApproved: true, // ✅ always approved
        });
        return newVideo.save();
    })
        .then((savedVideo) => {
        res.status(201).json({ message: "Video uploaded successfully!", video: savedVideo });
    })
        .catch((error) => {
        res.status(500).json({ error: "Internal server error", details: error });
    });
};
exports.uploadLibraryVideo = uploadLibraryVideo;
// ✅ Update Library Video
const updateLibraryVideo = (req, res) => {
    var _a, _b, _c;
    const { id } = req.params;
    const { title, author, subject, keywords, description } = req.body;
    const videoFile = req.files
        ? (Array.isArray(req.files)
            ? req.files.find(file => file.fieldname === 'video')
            : (_a = req.files['video']) === null || _a === void 0 ? void 0 : _a[0])
        : undefined;
    const coverImageFile = req.files
        ? (Array.isArray(req.files)
            ? req.files.find(file => file.fieldname === 'coverImage')
            : (_b = req.files['coverImage']) === null || _b === void 0 ? void 0 : _b[0])
        : undefined;
    const thumbnailFile = req.files
        ? (Array.isArray(req.files)
            ? req.files.find(file => file.fieldname === 'thumbnail')
            : (_c = req.files['thumbnail']) === null || _c === void 0 ? void 0 : _c[0])
        : undefined;
    return LibraryBook_1.default.findById(id)
        .then((video) => {
        if (!video)
            throw new Error('Library Video not found');
        const updateData = { title, author, subject, description };
        if (keywords) {
            updateData.keywords = keywords.split(',').map((k) => k.trim().toLowerCase());
        }
        return Promise.all([
            videoFile
                ? cloudinary_1.default.v2.uploader.upload(videoFile.path, {
                    resource_type: 'video',
                    folder: 'library_videos',
                    access_mode: 'public',
                })
                : null,
            coverImageFile
                ? cloudinary_1.default.v2.uploader.upload(coverImageFile.path, {
                    folder: 'library_books/covers',
                    access_mode: 'public',
                })
                : null,
            thumbnailFile
                ? cloudinary_1.default.v2.uploader.upload(thumbnailFile.path, {
                    folder: 'library_books/thumbnails',
                    access_mode: 'public',
                })
                : null,
        ]).then(([videoResult, imageResult, thumbnailResult]) => {
            if (videoResult)
                updateData.videoUrl = videoResult.secure_url;
            if (imageResult)
                updateData.coverImage = imageResult.secure_url;
            if (thumbnailResult)
                updateData.thumbnail = thumbnailResult.secure_url;
            return LibraryBook_1.default.findByIdAndUpdate(id, updateData, { new: true });
        });
    })
        .then((updatedVideo) => {
        res.json({ message: 'Library Video updated successfully', video: updatedVideo });
    })
        .catch((err) => {
        res.status(500).json({ error: err.message });
    });
    return Promise.resolve();
};
exports.updateLibraryVideo = updateLibraryVideo;
// ✅ Get All Library Videos (with filters)
// ✅ Get Books
const getLibraryVideo = (req, res) => {
    const { search, title, author, subject, keyword } = req.query;
    const conditions = [];
    if (search)
        conditions.push({ $text: { $search: search } });
    if (title)
        conditions.push({ title: new RegExp(title, 'i') });
    if (author)
        conditions.push({ author: new RegExp(author, 'i') });
    if (subject)
        conditions.push({ subject: new RegExp(subject, 'i') });
    if (keyword)
        conditions.push({ keywords: { $in: [keyword.toLowerCase()] } });
    const query = conditions.length > 0 ? { $and: conditions } : {};
    LibraryBook_1.default.find(query)
        .then((videos) => res.json({ videos, total: videos.length }))
        .catch((err) => res.status(500).json({ error: err.message }));
    return Promise.resolve();
};
exports.getLibraryVideo = getLibraryVideo;
// ✅ Get Single Video by ID
const getLibraryVideoById = (req, res) => {
    LibraryBook_1.default.findById(req.params.id)
        .then((video) => video ? res.json({ video }) : res.status(404).json({ message: 'Library Video not found' }))
        .catch((err) => res.status(500).json({ error: err.message }));
    return Promise.resolve();
};
exports.getLibraryVideoById = getLibraryVideoById;
// ✅ Get All Videos 
const getAllLibraryVideo = (req, res) => {
    LibraryBook_1.default.find()
        .then((videos) => res.json({ videos, total: videos.length }))
        .catch((err) => res.status(500).json({ error: err.message }));
    return Promise.resolve();
};
exports.getAllLibraryVideo = getAllLibraryVideo;
// ✅ Delete Library Video
// export const deleteLibraryVideo = (req: AuthenticatedRequest, res: Response): Promise<void> => {
//   LibraryVideo.findByIdAndDelete(req.params.id)
//     .then((deletedVideo) =>
//       deletedVideo
//         ? res.json({ message: 'Library Video deleted successfully' })
//         : res.status(404).json({ message: 'Library Video not found' })
//     )
//     .catch((err) => res.status(500).json({ error: err.message }));
//   return Promise.resolve();
// };
const deleteLibraryVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield LibraryBook_1.default.findById(req.params.id);
        if (!video) {
            res.status(404).json({ message: "Library video not found" });
            return;
        }
        const recycleEntry = new LibraryVideoRecycleBinModel_1.default({
            originalVideoId: video._id, // Storing the deleted ID
            title: video.title,
            author: video.author,
            subject: video.subject,
            keywords: video.keywords,
            videoUrl: video.videoUrl,
            coverImage: video.coverImage,
            description: video.description,
            uploadedBy: video.uploadedBy,
            deletedAt: new Date(),
        });
        yield recycleEntry.save(); // Save to recycle bin
        yield LibraryBook_1.default.findByIdAndDelete(video._id); // Delete original
        res.status(200).json({ message: "Library video moved to Recycle Bin successfully" });
    }
    catch (error) {
        console.error("Error in deleteLibraryVideo:", error.message);
        res.status(500).json({ message: "Error while deleting library video", error: error.message });
    }
});
exports.deleteLibraryVideo = deleteLibraryVideo;
