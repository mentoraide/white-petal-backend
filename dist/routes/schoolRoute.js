"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Middleware_1 = require("../lib/Utils/Middleware");
const schoolController_1 = require("../controllers/schoolController");
const Route = (0, express_1.Router)();
const SCHOOL = "school";
const ADMIN = "admin";
// Create a School 
Route.post("/createSchool", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(SCHOOL), schoolController_1.createSchool);
// Approve a School (Admin Only)
Route.put("/approve/:schoolID", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), schoolController_1.approveSchool);
// Reject a School (Admin Only)
Route.put("/reject/:schoolID", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), schoolController_1.rejectSchool);
// Get All Approved Schools
Route.get("/getAllSchool", schoolController_1.getAllSchools);
// Get a Single Approved School by ID
Route.get("/getSingleSchoolById/:schoolID", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(SCHOOL), schoolController_1.getSchoolById);
// Update a School (Before Approval)
Route.put("/updateSchool/:schoolID", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(SCHOOL), schoolController_1.updateSchool);
// Delete a School (Before Approval)
Route.delete("/deleteSchool/:schoolID", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(SCHOOL), schoolController_1.deleteSchool);
Route.get("/getAllStudent", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(SCHOOL, ADMIN), schoolController_1.getAllStudent);
exports.default = Route;
