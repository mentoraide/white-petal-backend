"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/GalleryRecycleBinRoutes.ts
const express_1 = require("express");
const GalleryRecycleBinController_1 = require("../controllers/GalleryRecycleBinController");
const Middleware_1 = require("../lib/Utils/Middleware");
const ADMIN = "admin";
const SCHOOL = "school";
const Route = (0, express_1.Router)();
Route.get("/getAllRecycleImages", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), GalleryRecycleBinController_1.getAllRecycleItems);
Route.post("/restoreRecycleImage/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), GalleryRecycleBinController_1.restoreImage);
Route.delete("/permanentDeleteRecycleImage/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), GalleryRecycleBinController_1.permanentDeleteImage);
exports.default = Route;
