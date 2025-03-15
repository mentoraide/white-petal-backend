"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserWatchedVideos = exports.getWatchedUsers = exports.markVideoAsWatched = void 0;
const watchedVideo_1 = __importDefault(require("../models/watchedVideo"));
// Mark Video as Watched
const markVideoAsWatched = (req, res) => {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const videoId = req.params.id;
    watchedVideo_1.default.findOne({ videoId, userId: req.user.id })
        .then(existingEntry => {
        if (existingEntry) {
            res.status(200).json({ message: "Already watched", existingEntry });
            return;
        }
        return new watchedVideo_1.default({ videoId, userId: req.user.id }).save();
    })
        .then(newWatchedEntry => {
        if (newWatchedEntry) {
            res.status(201).json({ message: "Marked as watched", newWatchedEntry });
        }
    })
        .catch(error => res.status(400).json({ message: error.message }));
};
exports.markVideoAsWatched = markVideoAsWatched;
// Get Users Who Watched a Video
const getWatchedUsers = (req, res) => {
    watchedVideo_1.default.find({ videoId: req.params.id })
        .populate("userId", "name email profilePicture")
        .then(watchedVideos => {
        if (!watchedVideos.length) {
            res.status(404).json({ message: "No users have watched this video" });
            return;
        }
        res.json({ watchedBy: watchedVideos.map(entry => entry.userId) });
    })
        .catch(error => res.status(400).json({ message: error.message }));
};
exports.getWatchedUsers = getWatchedUsers;
// Get All Videos Watched by a User
const getUserWatchedVideos = (req, res) => {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    watchedVideo_1.default.find({ userId: req.user._id })
        .populate("videoId", "title description")
        .then(watchedVideos => res.json({ watchedVideos }))
        .catch(error => res.status(400).json({ message: error.message }));
};
exports.getUserWatchedVideos = getUserWatchedVideos;
