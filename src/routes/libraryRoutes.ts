import { Router } from "express";
import { approveLibraryVideo, deleteLibraryVideo, getAllLibraryVideo, getLibraryVideo, getLibraryVideoById, rejectLibraryVideo, updateLibraryVideo, uploadLibraryVideo } from "../controllers/LibraryController";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";
import multer from "multer";

const Route: Router = Router();
const upload = multer({ dest: "uploads/" });

// Define roles
const ADMIN = "admin";
const SCHOOL = "school";

// ✅ Upload book (Restricted to Admin & School, Needs Approval)
Route.post(
  "/uploadLibraryVideo",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL),
  upload.fields([{ name: "video", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
  uploadLibraryVideo
);

// ✅ Approve Book (Admin only)
Route.put("/approveLibraryVideo/:id", authenticate, authorizeRoles(ADMIN), approveLibraryVideo);
Route.put("/rejectLibraryVideo/:id", authenticate, authorizeRoles(ADMIN), rejectLibraryVideo);

// ✅ Get Books (Search & Filter)
Route.get('/searchLibraryVideo', getLibraryVideo);

// ✅ Get Single Book by ID
Route.get("/LibraryVideo/:id", getLibraryVideoById);

// ✅ Get All Books with Pagination
Route.get("/allLibraryVideo", getAllLibraryVideo);

// ✅ Update Book (Restricted to Admin & School)
Route.put(
  "/LibraryVideo/:id",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL),
  upload.fields([{ name: "video", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
  updateLibraryVideo
);

// ✅ Delete a book (Admin & School)
Route.delete("/LibraryVideo/:id", authenticate, authorizeRoles(ADMIN, SCHOOL), deleteLibraryVideo);

export default Route;
