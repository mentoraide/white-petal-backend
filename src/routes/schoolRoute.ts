import { Router } from "express";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";
import {
  createSchool,
  approveSchool,
  rejectSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  getAllStudent,
} from "../controllers/schoolController";

const Route: Router = Router();

const SCHOOL = "school";
const ADMIN = "admin";

// Create a School 
Route.post("/createSchool", authenticate, authorizeRoles(SCHOOL), createSchool);

// Approve a School (Admin Only)
Route.put("/approve/:schoolID", authenticate, authorizeRoles(ADMIN), approveSchool);

// Reject a School (Admin Only)
Route.put("/reject/:schoolID", authenticate, authorizeRoles(ADMIN), rejectSchool);

// Get All Approved Schools
Route.get("/getAllSchool", getAllSchools);

// Get a Single Approved School by ID
Route.get("/getSingleSchoolById/:schoolID", authenticate, authorizeRoles(SCHOOL), getSchoolById);

// Update a School (Before Approval)
Route.put("/updateSchool/:schoolID", authenticate, authorizeRoles(SCHOOL), updateSchool);

// Delete a School (Before Approval)
Route.delete("/deleteSchool/:schoolID", authenticate, authorizeRoles(SCHOOL), deleteSchool);

Route.get("/getAllStudent",authenticate,authorizeRoles(SCHOOL,ADMIN),getAllStudent);

export default Route;

