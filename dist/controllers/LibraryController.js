"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBook = exports.updateBook = exports.getAllBooksAndResources = exports.getBookById = exports.getBooks = exports.rejectBook = exports.approveBook = exports.uploadBook = void 0;
const LibraryBook_1 = __importDefault(require("../models/LibraryBook"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// 📌 **Upload Book Controller**
const uploadBook = (req, res) => {
    var _a, _b;
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return Promise.resolve();
    }
    const { title, author, subject, keywords, description } = req.body;
    // Get uploaded files
    const pdfFile = req.files && ((_a = req.files.pdf) === null || _a === void 0 ? void 0 : _a[0]);
    const coverImageFile = req.files && ((_b = req.files.coverImage) === null || _b === void 0 ? void 0 : _b[0]);
    if (!pdfFile || !coverImageFile) {
        res.status(400).json({ error: "Both PDF and cover image are required." });
        return Promise.resolve();
    }
    return Promise.all([
        cloudinary_1.default.v2.uploader.upload(pdfFile.path, { resource_type: 'auto', folder: 'library_books' }),
        cloudinary_1.default.v2.uploader.upload(coverImageFile.path, { folder: 'library_books/covers' })
    ])
        .then(([pdfResult, coverImageResult]) => {
        if (!pdfResult.secure_url || !coverImageResult.secure_url) {
            throw new Error("File upload to Cloudinary failed");
        }
        const newBook = new LibraryBook_1.default({
            title,
            author,
            subject,
            keywords: keywords ? keywords.split(',').map((k) => k.trim().toLowerCase()) : [],
            description,
            pdfUrl: pdfResult.secure_url,
            coverImage: coverImageResult.secure_url,
            uploadedBy: req.user.id, // ✅ TypeScript won't complain now
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
exports.uploadBook = uploadBook;
// ✅ Approve Book (Only Admins)
const approveBook = (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ message: 'Only admins can approve books' });
        return Promise.resolve();
    }
    LibraryBook_1.default.findByIdAndUpdate(req.params.id, { isApproved: true, approvedBy: req.user.id }, { new: true })
        .then((book) => {
        if (!book)
            res.status(404).json({ message: 'Book not found' });
        else
            res.json({ message: 'Book approved successfully', book });
    })
        .catch((err) => res.status(500).json({ error: err.message }));
    return Promise.resolve();
};
exports.approveBook = approveBook;
// ✅ Reject Book (Only Admins)
const rejectBook = (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ message: 'Only admins can reject books' });
        return Promise.resolve();
    }
    LibraryBook_1.default.findByIdAndUpdate(req.params.id, { isApproved: false, approvedBy: req.user.id }, { new: true })
        .then((book) => {
        if (!book)
            res.status(404).json({ message: 'Book not found' });
        else
            res.json({ message: 'Book reject successfully', book });
    })
        .catch((err) => res.status(500).json({ error: err.message }));
    return Promise.resolve();
};
exports.rejectBook = rejectBook;
// ✅ Get Books
const getBooks = (req, res) => {
    const { search, title, author, subject, keyword } = req.query;
    const query = {};
    if (search)
        query.$text = { $search: search };
    if (title)
        query.title = new RegExp(title, 'i');
    if (author)
        query.author = new RegExp(author, 'i');
    if (subject)
        query.subject = new RegExp(subject, 'i');
    if (keyword)
        query.keywords = { $in: [keyword.toLowerCase()] };
    LibraryBook_1.default.find(query)
        .then((books) => res.json({ books, total: books.length }))
        .catch((err) => res.status(500).json({ error: err.message }));
    return Promise.resolve();
};
exports.getBooks = getBooks;
// ✅ Get Single Book by ID
const getBookById = (req, res) => {
    LibraryBook_1.default.findById(req.params.id)
        .then((book) => book ? res.json({ book }) : res.status(404).json({ message: 'Book not found' }))
        .catch((err) => res.status(500).json({ error: err.message }));
    return Promise.resolve();
};
exports.getBookById = getBookById;
// ✅ Get All Books with Pagination
const getAllBooksAndResources = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    LibraryBook_1.default.find()
        .skip(skip)
        .limit(limit)
        .then((books) => res.json({ books, total: books.length, page, limit }))
        .catch((err) => res.status(500).json({ error: err.message }));
    return Promise.resolve();
};
exports.getAllBooksAndResources = getAllBooksAndResources;
// ✅ Update Book with New PDF & Cover Image Handling
const updateBook = (req, res) => {
    var _a, _b;
    const { id } = req.params;
    const { title, author, subject, keywords, description } = req.body;
    const pdfFile = req.files
        ? (Array.isArray(req.files)
            ? req.files.find(file => file.fieldname === 'pdf')
            : (_a = req.files['pdf']) === null || _a === void 0 ? void 0 : _a[0])
        : undefined;
    const coverImageFile = req.files
        ? (Array.isArray(req.files)
            ? req.files.find(file => file.fieldname === 'coverImage')
            : (_b = req.files['coverImage']) === null || _b === void 0 ? void 0 : _b[0])
        : undefined;
    return LibraryBook_1.default.findById(id)
        .then((book) => {
        if (!book)
            throw new Error('Book not found');
        const updateData = { title, author, subject, description };
        if (keywords) {
            updateData.keywords = keywords.split(',').map((k) => k.trim().toLowerCase());
        }
        return Promise.all([
            pdfFile
                ? cloudinary_1.default.v2.uploader.upload(pdfFile.path, {
                    resource_type: 'auto',
                    folder: 'library_books',
                    access_mode: 'public',
                })
                : null,
            coverImageFile
                ? cloudinary_1.default.v2.uploader.upload(coverImageFile.path, {
                    folder: 'library_books/covers',
                    access_mode: 'public',
                })
                : null,
        ]).then(([pdfResult, imageResult]) => {
            if (pdfResult)
                updateData.pdfUrl = pdfResult.secure_url.replace('/raw/', '/upload/');
            if (imageResult)
                updateData.coverImage = imageResult.secure_url;
            return LibraryBook_1.default.findByIdAndUpdate(id, updateData, { new: true });
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
exports.updateBook = updateBook;
// ✅ Delete Book
const deleteBook = (req, res) => {
    LibraryBook_1.default.findByIdAndDelete(req.params.id)
        .then((deletedBook) => deletedBook ? res.json({ message: 'Book deleted successfully' }) : res.status(404).json({ message: 'Book not found' }))
        .catch((err) => res.status(500).json({ error: err.message }));
    return Promise.resolve();
};
exports.deleteBook = deleteBook;
