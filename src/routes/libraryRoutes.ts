import { Router } from "express";
import {
  uploadBook,
  approveBook,
  rejectBook,
  getBooks,
  getBookById,
  getAllBooksAndResources,
  updateBook,
  deleteBook
} from "../controllers/LibraryController";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";
import multer from "multer";

const Route: Router = Router();
const upload = multer({ dest: "uploads/" });

// Define roles
const ADMIN = "admin";
const SCHOOL = "school";

// ✅ Upload book (Restricted to Admin & School, Needs Approval)
Route.post(
  "/uploadBook",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL),
  upload.fields([{ name: "pdf", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
  uploadBook
);

// ✅ Approve Book (Admin only)
Route.put("/approveBook/:id", authenticate, authorizeRoles(ADMIN), approveBook);
Route.put("/rejectBook/:id", authenticate, authorizeRoles(ADMIN), rejectBook);

// ✅ Get Books (Search & Filter)
Route.get("/searchBook", getBooks);

// ✅ Get Single Book by ID
Route.get("/books/:id", getBookById);

// ✅ Get All Books with Pagination
Route.get("/allBooks", getAllBooksAndResources);

// ✅ Update Book (Restricted to Admin & School)
Route.put(
  "/books/:id",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL),
  upload.fields([{ name: "pdf", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
  updateBook
);

// ✅ Delete a book (Admin & School)
Route.delete("/books/:id", authenticate, authorizeRoles(ADMIN, SCHOOL), deleteBook);

export default Route;
