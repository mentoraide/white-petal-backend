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
Route.post("/uploadBook", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), upload.fields([{ name: "pdf", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), LibraryController_1.uploadBook);
// ✅ Approve Book (Admin only)
Route.put("/approveBook/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), LibraryController_1.approveBook);
Route.put("/rejectBook/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), LibraryController_1.rejectBook);
// ✅ Get Books (Search & Filter)
Route.get("/searchBook", LibraryController_1.getBooks);
// ✅ Get Single Book by ID
Route.get("/books/:id", LibraryController_1.getBookById);
// ✅ Get All Books with Pagination
Route.get("/allBooks", LibraryController_1.getAllBooksAndResources);
// ✅ Update Book (Restricted to Admin & School)
Route.put("/books/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), upload.fields([{ name: "pdf", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), LibraryController_1.updateBook);
// ✅ Delete a book (Admin & School)
Route.delete("/books/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), LibraryController_1.deleteBook);
exports.default = Route;
