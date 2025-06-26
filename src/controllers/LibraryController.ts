import { Request, Response } from 'express';
import LibraryVideo from '../models/LibraryBook';
import cloudinary from 'cloudinary';
import LibraryRecycleBinModel from "../models/LibraryVideoRecycleBinModel"

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
}

// 📌 Upload Library Video
export const uploadLibraryVideo = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return Promise.resolve();
  }

  const { title, author, subject, keywords, description } = req.body;

  const videoFile = req.files && (req.files as { video?: Express.Multer.File[] }).video?.[0];
  const coverImageFile = req.files && (req.files as { coverImage?: Express.Multer.File[] }).coverImage?.[0];

  if (!videoFile || !coverImageFile) {
    res.status(400).json({ error: "Both video and cover image are required." });
    return Promise.resolve();
  }

  return Promise.all([
    cloudinary.v2.uploader.upload(videoFile.path, { resource_type: 'video', folder: 'library_videos' }),
    cloudinary.v2.uploader.upload(coverImageFile.path, { folder: 'library_books/covers' })
  ])
    .then(([videoResult, coverImageResult]) => {
      if (!videoResult.secure_url || !coverImageResult.secure_url) {
        throw new Error("File upload to Cloudinary failed");
      }

      const newVideo = new LibraryVideo({
        title,
        author,
        subject,
        keywords: keywords ? keywords.split(',').map((k: string) => k.trim().toLowerCase()) : [],
        description,
        videoUrl: videoResult.secure_url,
        coverImage: coverImageResult.secure_url,
        uploadedBy: req.user!.id,
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

// ✅ Update Library Video
export const updateLibraryVideo = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, author, subject, keywords, description } = req.body;

  const videoFile = req.files
    ? (Array.isArray(req.files)
        ? req.files.find(file => file.fieldname === 'video')
        : (req.files['video'] as Express.Multer.File[])?.[0])
    : undefined;

  const coverImageFile = req.files
    ? (Array.isArray(req.files)
        ? req.files.find(file => file.fieldname === 'coverImage')
        : (req.files['coverImage'] as Express.Multer.File[])?.[0])
    : undefined;

  const thumbnailFile = req.files
    ? (Array.isArray(req.files)
        ? req.files.find(file => file.fieldname === 'thumbnail')
        : (req.files['thumbnail'] as Express.Multer.File[])?.[0])
    : undefined;

  return LibraryVideo.findById(id)
    .then((video) => {
      if (!video) throw new Error('Library Video not found');

      const updateData: any = { title, author, subject, description };
      if (keywords) {
        updateData.keywords = keywords.split(',').map((k: string) => k.trim().toLowerCase());
      }

      return Promise.all([
        videoFile
          ? cloudinary.v2.uploader.upload(videoFile.path, {
              resource_type: 'video',
              folder: 'library_videos',
              access_mode: 'public',
            })
          : null,
        coverImageFile
          ? cloudinary.v2.uploader.upload(coverImageFile.path, {
              folder: 'library_books/covers',
              access_mode: 'public',
            })
          : null,
        thumbnailFile
          ? cloudinary.v2.uploader.upload(thumbnailFile.path, {
              folder: 'library_books/thumbnails',
              access_mode: 'public',
            })
          : null,
      ]).then(([videoResult, imageResult, thumbnailResult]) => {
        if (videoResult) updateData.videoUrl = videoResult.secure_url;
        if (imageResult) updateData.coverImage = imageResult.secure_url;
        if (thumbnailResult) updateData.thumbnail = thumbnailResult.secure_url;

        return LibraryVideo.findByIdAndUpdate(id, updateData, { new: true });
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

// ✅ Get All Library Videos (with filters)
// ✅ Get Books
export const getLibraryVideo = (req: Request, res: Response): Promise<void> => {
  const { search, title, author, subject, keyword } = req.query;

  const conditions: any[] = [];

  if (search) conditions.push({ $text: { $search: search as string } });
  if (title) conditions.push({ title: new RegExp(title as string, 'i') });
  if (author) conditions.push({ author: new RegExp(author as string, 'i') });
  if (subject) conditions.push({ subject: new RegExp(subject as string, 'i') });
  if (keyword) conditions.push({ keywords: { $in: [(keyword as string).toLowerCase()] } });

  const query = conditions.length > 0 ? { $and: conditions } : {};

  LibraryVideo.find(query)
    .then((videos) => res.json({ videos, total: videos.length }))
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};


// ✅ Get Single Video by ID
export const getLibraryVideoById = (req: Request, res: Response): Promise<void> => {
  LibraryVideo.findById(req.params.id)
    .then((video) => video ? res.json({ video }) : res.status(404).json({ message: 'Library Video not found' }))
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};

// ✅ Get All Videos 
export const getAllLibraryVideo = (req: Request, res: Response): Promise<void> => {
  LibraryVideo.find()
    .then((videos) => res.json({ videos, total: videos.length }))
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};


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

export const deleteLibraryVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await LibraryVideo.findById(req.params.id);
    if (!video) {
      res.status(404).json({ message: "Library video not found" });
      return;
    }

    const recycleEntry = new LibraryRecycleBinModel({
      originalVideoId: video._id,       // Storing the deleted ID
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

    await recycleEntry.save();               // Save to recycle bin
    await LibraryVideo.findByIdAndDelete(video._id); // Delete original

    res.status(200).json({ message: "Library video moved to Recycle Bin successfully" });
  } catch (error: any) {
    console.error("Error in deleteLibraryVideo:", error.message);
    res.status(500).json({ message: "Error while deleting library video", error: error.message });
  }
};

