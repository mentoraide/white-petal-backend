import { Router } from "express"
import UserAuthController from "../controllers/authController"
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";
const Route: Router = Router()

import multer from "multer";
const uploadImages = multer({ dest: "uploads/" });

const ADMIN = "admin";
const SCHOOL = "school";

Route.post("/register", UserAuthController.register)
Route.post("/login", UserAuthController.login)
Route.post("/forgot-password", UserAuthController.forgotPassword)
Route.post("/reset-password/:token", UserAuthController.resetPassword)
Route.post("/logout",authenticate,UserAuthController.logout)

// Users can see their own profile, and Admin can see any user's profile
Route.get("/profile", authenticate, UserAuthController.getUserProfile);
Route.get("/profile/:userId", authenticate, authorizeRoles(ADMIN), UserAuthController.getUserProfile);

Route.put("/update-profile/:userId",authenticate,uploadImages.single("profilePhoto"),UserAuthController.updateUserProfile);

// Admin can approve instructor & school users
Route.put(
    "/approve-user/:userId",
    authenticate,
    authorizeRoles(ADMIN,SCHOOL),
    UserAuthController.approveUser
  );

  // Admin can reject users
Route.delete(
  "/reject-user/:userId",
  authenticate,
  authorizeRoles(ADMIN), 
  UserAuthController.rejectUserbyAdmin
);

// Get all users who approved
Route.get("/getAllApprovalUsers",  authenticate,
  authorizeRoles(ADMIN), UserAuthController.getApprovedUsers);


  // Get all users who need approval
Route.get("/getAllPendingUsers",  authenticate,
  authorizeRoles(ADMIN), UserAuthController.getPendingUsers);

  // Delete user permanently
Route.delete("/delete-user/:userId",  authenticate,
  authorizeRoles(ADMIN), UserAuthController.RejectUsers);


  // Admin also can create instructor or school users
Route.post(
    "/create-user-by-admin",
    authenticate,
    authorizeRoles(ADMIN), 
    UserAuthController.createUserByAdmin
  );


export default Route;
