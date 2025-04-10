"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LibraryController_1 = require("../controllers/LibraryController");
const Middleware_1 = require("../lib/Utils/Middleware");
const multer_1 = __importDefault(require("multer"));
const Route = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: "uploads/" });
// Define roles
const ADMIN = "admin";
const SCHOOL = "school";
// ✅ Upload book (Restricted to Admin & School, Needs Approval)
Route.post("/uploadLibraryVideo", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), upload.fields([{ name: "video", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), LibraryController_1.uploadLibraryVideo);
// ✅ Approve Book (Admin only)
// ✅ Get Books (Search & Filter)
Route.get('/searchLibraryVideo', LibraryController_1.getLibraryVideo);
// ✅ Get Single Book by ID
Route.get("/LibraryVideo/:id", LibraryController_1.getLibraryVideoById);
// ✅ Get All Books with Pagination
Route.get("/allLibraryVideo", LibraryController_1.getAllLibraryVideo);
// ✅ Update Book (Restricted to Admin & School)
Route.put("/LibraryVideo/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), upload.fields([{ name: "video", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), LibraryController_1.updateLibraryVideo);
// ✅ Delete a book (Admin & School)
Route.delete("/LibraryVideo/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), LibraryController_1.deleteLibraryVideo);
exports.default = Route;
