import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, updateVideo, uploadVideo,getInstructorProfile } from "../controllers/videoController";
import {upload }from "../lib/Utils/multer"; // Import Multer config
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

const Route: Router = Router();

// Define roles
const ADMIN = "admin";
const INSTRUCTOR = "instructor";
const SCHOOL = "school";
const USER = "user";

// Role-based access for video routes
Route.post("/upload", authenticate,
authorizeRoles(ADMIN, INSTRUCTOR),
    upload, // Use updated multer middleware
    uploadVideo
); // Admin & Instructor can upload
Route.get("/getSingleVideo/:id", authenticate, authorizeRoles(ADMIN, USER, SCHOOL, INSTRUCTOR), getVideoById); // Everyone can see Video List Display (Thumbnails & Titles)
Route.get("/getAllVideos", authenticate, authorizeRoles(ADMIN, USER, SCHOOL, INSTRUCTOR), getAllVideos); // Video List Display (Thumbnails & Titles) or Everyone can view all videos
Route.put("/updateVideo/:id", authenticate, authorizeRoles(ADMIN, INSTRUCTOR), upload, updateVideo); // Only Admin & Instructor can update
Route.delete("/deleteVideo/:id", authenticate, authorizeRoles(ADMIN, INSTRUCTOR), deleteVideo); // Only Admin & Instructor can delete
Route.get("/instructorProfile/:id", authenticate, authorizeRoles(ADMIN, USER, SCHOOL, INSTRUCTOR), getInstructorProfile); // Instructor Profile Display


export default Route;
