import { Request, Response } from "express";
import WatchedVideo from "../models/watchedVideo";
import { IUser } from "../models/user";

// Define AuthRequest interface
interface AuthRequest extends Request {
    user?: IUser;
}

// Mark Video as Watched
export const markVideoAsWatched = (req: AuthRequest, res: Response): void => {
    if (!req.user?. id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const videoId = req.params.id;

    WatchedVideo.findOne({ videoId, userId: req.user.id })
        .then(existingEntry => {
            if (existingEntry) {
                res.status(200).json({ message: "Already watched", existingEntry });
                return;
            }
            return new WatchedVideo({ videoId, userId: req.user!.id }).save();
        })
        .then(newWatchedEntry => {
            if (newWatchedEntry) {
                res.status(201).json({ message: "Marked as watched", newWatchedEntry });
            }
        })
        .catch(error => res.status(400).json({ message: error.message }));
};

// Get Users Who Watched a Video
export const getWatchedUsers = (req: Request, res: Response): void => {
    WatchedVideo.find({ videoId: req.params.id })
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

// Get All Videos Watched by a User
export const getUserWatchedVideos = (req: AuthRequest, res: Response): void => {
    if (!req.user?._id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    WatchedVideo.find({ userId: req.user._id })
        .populate("videoId", "title description")
        .then(watchedVideos => res.json({ watchedVideos }))
        .catch(error => res.status(400).json({ message: error.message }));
};
