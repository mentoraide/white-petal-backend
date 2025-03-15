import { Request, Response } from 'express';
import Book from '../models/LibraryBook';
import cloudinary from 'cloudinary';

// Define an extended Request interface to include `user` and `files``
interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string }; // Modify based on your user object
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
}

// 📌 **Upload Book Controller**
export const uploadBook = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return Promise.resolve();
  }

  const { title, author, subject, keywords, description } = req.body;

  // Get uploaded files
  const pdfFile = req.files && (req.files as { pdf?: Express.Multer.File[] }).pdf?.[0];
  const coverImageFile = req.files && (req.files as { coverImage?: Express.Multer.File[] }).coverImage?.[0];

  if (!pdfFile || !coverImageFile) {
    res.status(400).json({ error: "Both PDF and cover image are required." });
    return Promise.resolve();
  }

  return Promise.all([
    cloudinary.v2.uploader.upload(pdfFile.path, { resource_type: 'auto', folder: 'library_books' }),
    cloudinary.v2.uploader.upload(coverImageFile.path, { folder: 'library_books/covers' })
  ])
    .then(([pdfResult, coverImageResult]) => {
      if (!pdfResult.secure_url || !coverImageResult.secure_url) {
        throw new Error("File upload to Cloudinary failed");
      }

      const newBook = new Book({
        title,
        author,
        subject,
        keywords: keywords ? keywords.split(',').map((k: string) => k.trim().toLowerCase()) : [],
        description,
        pdfUrl: pdfResult.secure_url,
        coverImage: coverImageResult.secure_url,
        uploadedBy: req.user!.id, // ✅ TypeScript won't complain now
        isApproved: false,
      });

      return newBook.save();
    })
    .then((savedBook) => {
      res.status(201).json({ message: "Book uploaded successfully!", book: savedBook });
    })
    .catch((error) => {
      res.status(500).json({ error: "Internal server error", details: error });
    });
};

// ✅ Approve Book (Only Admins)
export const approveBook = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Only admins can approve books' });
    return Promise.resolve();
  }

  Book.findByIdAndUpdate(req.params.id, { isApproved: true, approvedBy: req.user.id }, { new: true })
    .then((book) => {
      if (!book) res.status(404).json({ message: 'Book not found' });
      else res.json({ message: 'Book approved successfully', book });
    })
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};

// ✅ Reject Book (Only Admins)
export const rejectBook = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Only admins can reject books' });
    return Promise.resolve();
  }

  Book.findByIdAndUpdate(req.params.id, { isApproved: false, approvedBy: req.user.id }, { new: true })
    .then((book) => {
      if (!book) res.status(404).json({ message: 'Book not found' });
      else res.json({ message: 'Book reject successfully', book });
    })
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};

// ✅ Get Books
export const getBooks = (req: Request, res: Response): Promise<void> => {
  const { search, title, author, subject, keyword } = req.query;
  const query: any = {};

  if (search) query.$text = { $search: search as string };
  if (title) query.title = new RegExp(title as string, 'i');
  if (author) query.author = new RegExp(author as string, 'i');
  if (subject) query.subject = new RegExp(subject as string, 'i');
  if (keyword) query.keywords = { $in: [(keyword as string).toLowerCase()] };

  Book.find(query)
    .then((books) => res.json({ books, total: books.length }))
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};

// ✅ Get Single Book by ID
export const getBookById = (req: Request, res: Response): Promise<void> => {
  Book.findById(req.params.id)
    .then((book) => book ? res.json({ book }) : res.status(404).json({ message: 'Book not found' }))
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};

// ✅ Get All Books with Pagination
export const getAllBooksAndResources = (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  Book.find()
    .skip(skip)
    .limit(limit)
    .then((books) => res.json({ books, total: books.length, page, limit }))
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};

// ✅ Update Book with New PDF & Cover Image Handling
export const updateBook = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, author, subject, keywords, description } = req.body;

  const pdfFile = req.files
    ? (Array.isArray(req.files)
        ? req.files.find(file => file.fieldname === 'pdf')
        : req.files['pdf']?.[0])
    : undefined;

  const coverImageFile = req.files
    ? (Array.isArray(req.files)
        ? req.files.find(file => file.fieldname === 'coverImage')
        : req.files['coverImage']?.[0])
    : undefined;

  return Book.findById(id)
    .then((book) => {
      if (!book) throw new Error('Book not found');

      const updateData: any = { title, author, subject, description };
      if (keywords) {
        updateData.keywords = keywords.split(',').map((k: string) => k.trim().toLowerCase());
      }
      

      return Promise.all([
        pdfFile
          ? cloudinary.v2.uploader.upload(pdfFile.path, {
              resource_type: 'auto',
              folder: 'library_books',
              access_mode: 'public',
            })
          : null,
        coverImageFile
          ? cloudinary.v2.uploader.upload(coverImageFile.path, {
              folder: 'library_books/covers',
              access_mode: 'public',
            })
          : null,
      ]).then(([pdfResult, imageResult]) => {
        if (pdfResult) updateData.pdfUrl = pdfResult.secure_url.replace('/raw/', '/upload/');
        if (imageResult) updateData.coverImage = imageResult.secure_url;

        return Book.findByIdAndUpdate(id, updateData, { new: true });
      });
    })
    .then((updatedBook) => {
      res.json({ message: 'Book updated successfully', book: updatedBook });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });

  return Promise.resolve();
};

// ✅ Delete Book
export const deleteBook = (req: AuthenticatedRequest, res: Response): Promise<void> => {
  Book.findByIdAndDelete(req.params.id)
    .then((deletedBook) => deletedBook ? res.json({ message: 'Book deleted successfully' }) : res.status(404).json({ message: 'Book not found' }))
    .catch((err) => res.status(500).json({ error: err.message }));

  return Promise.resolve();
};
