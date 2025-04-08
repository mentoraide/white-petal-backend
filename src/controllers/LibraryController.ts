import { Request, Response } from 'express';
import LibraryVideo from '../models/LibraryBook';
import cloudinary from 'cloudinary';

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
}

// 📌 Upload Book Controller (Now uploads video)
export const uploadLibraryVideo= (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const newBook = new LibraryVideo ({
        title,
        author,
        subject,
        keywords: keywords ? keywords.split(',').map((k: string) => k.trim().toLowerCase()) : [],
        description,
        videoUrl: videoResult.secure_url,
        coverImage: coverImageResult.secure_url,
        uploadedBy: req.user!.id,
        isApproved: false,
      });

      return newBook.save();
    })
    .then((savedBook) => {
      res.status(201).json({ message: "video uploaded successfully!", video: savedBook });
    })
    .catch((error) => {
      res.status(500).json({ error: "Internal server error", details: error });
    });
};

// ✅ Update Book with New Video & Cover Image Handling
export const updateLibraryVideo = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, author, subject, keywords, description } = req.body;

  const videoFile = req.files
    ? (Array.isArray(req.files)
        ? req.files.find(file => file.fieldname === 'video')
        : req.files['video']?.[0])
    : undefined;

  const coverImageFile = req.files
    ? (Array.isArray(req.files)
        ? req.files.find(file => file.fieldname === 'coverImage')
        : req.files['coverImage']?.[0])
    : undefined;

  return LibraryVideo .findById(id)
    .then((book) => {
      if (!book) throw new Error('Library Video not found');

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
      ]).then(([videoResult, imageResult]) => {
        if (videoResult) updateData.videoUrl = videoResult.secure_url;
        if (imageResult) updateData.coverImage = imageResult.secure_url;

        return LibraryVideo .findByIdAndUpdate(id, updateData, { new: true });
      });
    })
    .then((updatedBook) => {
      res.json({ message: 'Library Video updated successfully', video: updatedBook });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });

  return Promise.resolve();
};


// ✅ Approve LibraryVideo (Only Admins)
export const approveLibraryVideo = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Only admins can approve Library Video' });
    return Promise.resolve();
  }

  LibraryVideo.findByIdAndUpdate(req.params.id, { isApproved: true, approvedBy: req.user.id }, { new: true })
    .then((book) => {
      if (!book) res.status(404).json({ message: 'Video not found' });
      else res.json({ message: 'Library Video approved successfully', book });
    })
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};

// ✅ Reject LibraryVideo (Only Admins)
export const rejectLibraryVideo = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Only admins can reject Library Video' });
    return Promise.resolve();
  }

  LibraryVideo.findByIdAndUpdate(req.params.id, { isApproved: false, approvedBy: req.user.id }, { new: true })
    .then((book) => {
      if (!book) res.status(404).json({ message: 'Library Video not found' });
      else res.json({ message: 'Library Video reject successfully', book });
    })
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};

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


// ✅ Get Single Book by ID
export const getLibraryVideoById = (req: Request, res: Response): Promise<void> => {
  LibraryVideo .findById(req.params.id)
    .then((book) => book ? res.json({ book }) : res.status(404).json({ message: 'Library Video not found' }))
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};

// ✅ Get All Books with Pagination
export const getAllLibraryVideo = (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  LibraryVideo .find()
    .skip(skip)
    .limit(limit)
    .then((books) => res.json({ books, total: books.length, page, limit }))
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};


// ✅ Delete Book
export const deleteLibraryVideo = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  LibraryVideo.findByIdAndDelete(req.params.id)
    .then((deletedBook) => deletedBook ? res.json({ message: 'Library Video deleted successfully' }) : res.status(404).json({ message: 'Library Video not found' }))
    .catch((err: { message: any; }) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};
