import { Router } from "express";
import {
  uploadImage,
  approveImage,
  rejectImage,
  getGallery,
  updateImage,
  deleteImage,
  getPendingImages,
} from "../controllers/GalleryController";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

import { upload } from "../lib/Utils/s3Uploader"; // ✅ S3 upload middleware

const ADMIN = "admin";
const SCHOOL = "school";

const Route: Router = Router();

Route.post(
  "/upload",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL),
<<<<<<< HEAD
  upload.single("image"), // 🔁 changed from 'file' to 'image'
=======
  upload.single("file"), // ✅ this now goes to S3
>>>>>>> main
  uploadImage
);


Route.put("/approve/:id", authenticate, authorizeRoles(ADMIN), approveImage);
Route.put("/reject/:id", authenticate, authorizeRoles(ADMIN), rejectImage);
Route.get("/getGalleryImages", getGallery);
Route.get(
  "/getPendingImages",
  authenticate,
  authorizeRoles(ADMIN),
  getPendingImages
);
Route.put(
  "/update/:id",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL),
  updateImage
);
Route.delete(
  "/delete/:id",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL),
  deleteImage
);

export default Route;
