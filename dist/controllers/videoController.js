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
exports.getInstructorProfile = exports.deleteVideo = exports.updateVideo = exports.getAllVideos = exports.getVideoById = exports.uploadVideo = void 0;
const video_1 = __importDefault(require("../models/video"));
const Cloundinary_1 = __importDefault(require("../lib/Utils/Cloundinary"));
const recycleBin_1 = __importDefault(require("../models/recycleBin"));
// Upload Video with Thumbnail
const uploadVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user found" });
            return;
        }
        const files = req.files;
        if (!files || !files.video || !files.thumbnail) {
            res.status(400).json({ message: "Video or thumbnail file is missing" });
            return;
        }
        const videoFile = files.video[0];
        const thumbnailFile = files.thumbnail[0];
        // Upload Video to Cloudinary
        const videoUpload = yield Cloundinary_1.default.uploader.upload(videoFile.path, {
            resource_type: "video",
            folder: "instructor_videos",
        });
        // Upload Thumbnail to Cloudinary
        const thumbnailUpload = yield Cloundinary_1.default.uploader.upload(thumbnailFile.path, {
            folder: "thumbnails",
            transformation: [{ width: 300, height: 200, crop: "fill" }],
        });
        // Save Video to Database
        const video = new video_1.default({
            courseName: req.body.courseName,
            courseContent: req.body.courseContent,
            videoUrl: videoUpload.secure_url,
            description: req.body.description,
            status: req.body.status || "pending",
            uploadedBy: req.user._id.toString(), // ✅ FIXED HERE,
            watchedBy: [],
            thumbnailUrl: thumbnailUpload.secure_url,
        });
        yield video.save();
        res.status(201).json({ message: "Video uploaded successfully", video });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.uploadVideo = uploadVideo;
// View a Single Video
const getVideoById = (req, res) => {
    video_1.default.findById(req.params.id)
        .populate("uploadedBy", "name email role bio profilePicture")
        .then((video) => {
        if (!video) {
            res.status(404).json({ message: "Video not found" });
            return;
        }
        res.json(video);
    })
        .catch((error) => res.status(400).json({ message: error.message }));
};
exports.getVideoById = getVideoById;
// View All Videos
const getAllVideos = (req, res) => {
    try {
        video_1.default.find()
            .select("courseName courseContent videoUrl status description uploadedBy thumbnailUrl isPriced rank")
            .populate("uploadedBy", "name email bio profilePicture")
            .then((videos) => res.json(videos))
            .catch((error) => res.status(400).json({ message: error.message }));
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
};
exports.getAllVideos = getAllVideos;
// Update Video with Optional Video & Thumbnail Upload
const updateVideo = (req, res) => {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Unauthorized: No user found" });
    }
    const files = req.files;
    if (!files) {
        console.error("No files received");
    }
    const { courseName, courseContent, description, rank } = req.body;
    const updateFields = {};
    if (courseName)
        updateFields.courseName = courseName;
    if (courseContent)
        updateFields.courseContent = courseContent;
    if (description)
        updateFields.description = description;
    if (rank)
        updateFields.rank = rank;
    // If no files are uploaded, proceed with updating text fields only
    const videoPromise = (files === null || files === void 0 ? void 0 : files.video)
        ? Cloundinary_1.default.uploader.upload(files.video[0].path, {
            resource_type: "video",
            folder: "instructor_videos",
        })
        : Promise.resolve(null);
    const thumbnailPromise = (files === null || files === void 0 ? void 0 : files.thumbnail)
        ? Cloundinary_1.default.uploader.upload(files.thumbnail[0].path, {
            folder: "thumbnails",
            transformation: [{ width: 300, height: 200, crop: "fill" }],
        })
        : Promise.resolve(null);
    Promise.all([videoPromise, thumbnailPromise])
        .then(([videoUpload, thumbnailUpload]) => {
        // Only update URLs if uploads are successful
        if (videoUpload) {
            // Ensure videoUrl is assigned properly from Cloudinary's response
            updateFields.videoUrl = videoUpload.secure_url;
        }
        if (thumbnailUpload) {
            // Ensure thumbnailUrl is assigned properly from Cloudinary's response
            updateFields.thumbnailUrl = thumbnailUpload.secure_url;
        }
        // Proceed with video update
        return video_1.default.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
    })
        .then((updatedVideo) => {
        if (!updatedVideo) {
            return res.status(404).json({
                message: "Video not found or unauthorized update attempt",
            });
        }
        res.status(200).json({
            message: "Video updated successfully",
            updatedVideo,
        });
    })
        .catch((error) => {
        console.error("Error updating video:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    });
};
exports.updateVideo = updateVideo;
// Delete Video
// export const deleteVideo = (req: Request, res: Response): void => {
//   VideoModel.findByIdAndDelete(req.params.id)
//     .then((video) => {
//       if (!video) {
//         res.status(404).json({ message: "Video not found" });
//         return;
//       }
//       res.json({ message: "Video deleted successfully" });
//     })
//     .catch((error) => res.status(400).json({ message: error.message }));
// };
// ✅ DELETE VIDEO and move to Recycle Bin
const deleteVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield video_1.default.findById(req.params.id);
        if (!video) {
            res.status(404).json({ message: "Video not found" });
            return;
        }
        // Create recycle bin entry
        const recycleEntry = new recycleBin_1.default({
            originalVideoId: video._id, // <-- original video ID saved
            courseName: video.courseName,
            courseContent: video.courseContent,
            videoUrl: video.videoUrl,
            thumbnailUrl: video.thumbnailUrl,
            description: video.description,
            status: video.status,
            uploadedBy: video.uploadedBy,
            deletedAt: new Date(),
        });
        yield recycleEntry.save(); // Save recycle entry
        yield video_1.default.findByIdAndDelete(video._id); // Delete original video
        res.status(200).json({ message: "Video moved to Recycle Bin successfully" });
    }
    catch (error) {
        console.error("Error in deleteVideo:", error.message);
        res.status(500).json({ message: "Error while deleting video", error: error.message });
    }
});
exports.deleteVideo = deleteVideo;
// Get Instructor Profile
const getInstructorProfile = (req, res) => {
    const videoId = req.params.id;
    video_1.default.findById(videoId)
        .populate("uploadedBy", "name email bio profilePicture")
        .then((video) => {
        if (!video) {
            res.status(404).json({ message: "Video not found" });
            return;
        }
        if (!video.uploadedBy) {
            res
                .status(404)
                .json({ message: "Instructor not found or not assigned" });
            return;
        }
        res.json(video.uploadedBy);
    })
        .catch((error) => {
        res.status(500).json({ message: error.message });
    });
};
exports.getInstructorProfile = getInstructorProfile;
