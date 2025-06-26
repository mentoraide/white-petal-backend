import { Request, Response } from "express";
import VideoModel from "../models/video";
import { IUser } from "../models/user";
import cloudinary from "../lib/Utils/Cloundinary";
import RecycleBinModel from "../models/recycleBin";

// Define AuthRequest interface
interface AuthRequest extends Request {
  user?: IUser;
}

interface CustomUser {
  _id: string;
  name?: string;
  email?: string;
}

// Upload Video with Thumbnail
export const uploadVideo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized: No user found" });
      return;
    }
    const files = req.files as { [key: string]: Express.Multer.File[] };

    if (!files || !files.video || !files.thumbnail) {
      res.status(400).json({ message: "Video or thumbnail file is missing" });
      return;
    }

    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail[0];

    // Upload Video to Cloudinary
    const videoUpload = await cloudinary.uploader.upload(videoFile.path, {
      resource_type: "video",
      folder: "instructor_videos",
    });

    // Upload Thumbnail to Cloudinary
    const thumbnailUpload = await cloudinary.uploader.upload(
      thumbnailFile.path,
      {
        folder: "thumbnails",
        transformation: [{ width: 300, height: 200, crop: "fill" }],
      }
    );

    // Save Video to Database
    const video = new VideoModel({
      courseName: req.body.courseName,
      courseContent: req.body.courseContent,
      videoUrl: videoUpload.secure_url,
      description: req.body.description,
      status: req.body.status || "pending",
       uploadedBy: req.user._id.toString(), // ✅ FIXED HERE,
      watchedBy: [],
      thumbnailUrl: thumbnailUpload.secure_url,
    });

    await video.save();
    res.status(201).json({ message: "Video uploaded successfully", video });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// View a Single Video
export const getVideoById = (req: Request, res: Response): void => {
  VideoModel.findById(req.params.id)
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

// View All Videos
export const getAllVideos = (req: Request, res: Response): void => {
  try {
    VideoModel.find()
      .select(
        "courseName courseContent videoUrl status description uploadedBy thumbnailUrl isPriced rank"
      )
      .populate("uploadedBy", "name email bio profilePicture")
      .then((videos) => res.json(videos))
      .catch((error) => res.status(400).json({ message: error.message }));
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

// Update Video with Optional Video & Thumbnail Upload
export const updateVideo = (req: AuthRequest, res: Response): void => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ message: "Unauthorized: No user found" });
  }

  const files = req.files as { [key: string]: Express.Multer.File[] } | undefined;
  
  if (!files) {
    console.error("No files received");
  }

  const { courseName, courseContent, description, rank } = req.body;
  
  const updateFields: Partial<{
    courseName: string;
    courseContent: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    rank: string;
  }> = {};

  if (courseName) updateFields.courseName = courseName;
  if (courseContent) updateFields.courseContent = courseContent;
  if (description) updateFields.description = description;
  if (rank) updateFields.rank = rank;

  // If no files are uploaded, proceed with updating text fields only
  const videoPromise = files?.video
    ? cloudinary.uploader.upload(files.video[0].path, {
        resource_type: "video",
        folder: "instructor_videos",
      })
    : Promise.resolve(null);

  const thumbnailPromise = files?.thumbnail
    ? cloudinary.uploader.upload(files.thumbnail[0].path, {
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
      return VideoModel.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      );
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
export const deleteVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await VideoModel.findById(req.params.id);
    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    // Create recycle bin entry
    const recycleEntry = new RecycleBinModel({
      originalVideoId: video._id,               // <-- original video ID saved
      courseName: video.courseName,
      courseContent: video.courseContent,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      description: video.description,
      status: video.status,
      uploadedBy: video.uploadedBy,
      deletedAt: new Date(),
    });

    await recycleEntry.save();                  // Save recycle entry
    await VideoModel.findByIdAndDelete(video._id);  // Delete original video

    res.status(200).json({ message: "Video moved to Recycle Bin successfully" });
  } catch (error: any) {
    console.error("Error in deleteVideo:", error.message);
    res.status(500).json({ message: "Error while deleting video", error: error.message });
  }
};

// Get Instructor Profile
export const getInstructorProfile = (req: Request, res: Response): void => {
  const videoId = req.params.id;
  VideoModel.findById(videoId)
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
