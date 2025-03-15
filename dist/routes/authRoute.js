"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const Middleware_1 = require("../lib/Utils/Middleware");
const Route = (0, express_1.Router)();
const multer_1 = __importDefault(require("multer"));
const uploadImages = (0, multer_1.default)({ dest: "uploads/" });
const ADMIN = "admin";
const SCHOOL = "school";
Route.post("/register", authController_1.default.register);
Route.post("/login", authController_1.default.login);
Route.post("/forgot-password", authController_1.default.forgotPassword);
Route.post("/reset-password/:token", authController_1.default.resetPassword);
Route.post("/logout", Middleware_1.authenticate, authController_1.default.logout);
// Users can see their own profile, and Admin can see any user's profile
Route.get("/profile", Middleware_1.authenticate, authController_1.default.getUserProfile);
Route.get("/profile/:userId", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), authController_1.default.getUserProfile);
Route.put("/update-profile/:userId", Middleware_1.authenticate, uploadImages.single("profilePhoto"), authController_1.default.updateUserProfile);
// Admin can approve instructor & school users
Route.put("/approve-user/:userId", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), authController_1.default.approveUser);
// Admin can reject users
Route.delete("/reject-user/:userId", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), authController_1.default.rejectUserbyAdmin);
// Get all users who approved
Route.get("/getAllApprovalUsers", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), authController_1.default.getApprovedUsers);
// Get all users who need approval
Route.get("/getAllPendingUsers", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), authController_1.default.getPendingUsers);
// Delete user permanently
Route.delete("/delete-user/:userId", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), authController_1.default.RejectUsers);
// Admin also can create instructor or school users
Route.post("/create-user-by-admin", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), authController_1.default.createUserByAdmin);
exports.default = Route;
