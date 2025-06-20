"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GalleryController_1 = require("../controllers/GalleryController");
const Middleware_1 = require("../lib/Utils/Middleware");
const s3Uploader_1 = require("../lib/Utils/s3Uploader"); // ✅ S3 upload middleware
const ADMIN = "admin";
const SCHOOL = "school";
const Route = (0, express_1.Router)();
Route.post("/upload", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), s3Uploader_1.upload.single("file"), // ✅ this now goes to S3
GalleryController_1.uploadImage);
Route.put("/approve/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), GalleryController_1.approveImage);
Route.put("/reject/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), GalleryController_1.rejectImage);
Route.get("/getGalleryImages", GalleryController_1.getGallery);
Route.get("/getPendingImages", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), GalleryController_1.getPendingImages);
Route.put("/update/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), GalleryController_1.updateImage);
Route.delete("/delete/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), GalleryController_1.deleteImage);
exports.default = Route;
