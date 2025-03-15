"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoController_1 = require("../controllers/videoController");
const multer_1 = require("../lib/Utils/multer"); // Import Multer config
const Middleware_1 = require("../lib/Utils/Middleware");
const Route = (0, express_1.Router)();
// Define roles
const ADMIN = "admin";
const INSTRUCTOR = "instructor";
const SCHOOL = "school";
const USER = "user";
// Role-based access for video routes
Route.post("/upload", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, INSTRUCTOR), multer_1.upload, // Use updated multer middleware
videoController_1.uploadVideo); // Admin & Instructor can upload
Route.get("/getSingleVideo/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, USER, SCHOOL, INSTRUCTOR), videoController_1.getVideoById); // Everyone can see Video List Display (Thumbnails & Titles)
Route.get("/getAllVideos", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, USER, SCHOOL, INSTRUCTOR), videoController_1.getAllVideos); // Video List Display (Thumbnails & Titles) or Everyone can view all videos
Route.put("/updateVideo/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, INSTRUCTOR), multer_1.upload, videoController_1.updateVideo); // Only Admin & Instructor can update
Route.delete("/deleteVideo/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, INSTRUCTOR), videoController_1.deleteVideo); // Only Admin & Instructor can delete
Route.get("/instructorProfile/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, USER, SCHOOL, INSTRUCTOR), videoController_1.getInstructorProfile); // Instructor Profile Display
exports.default = Route;
