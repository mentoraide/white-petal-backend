"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const watchedVideoController_1 = require("../controllers/watchedVideoController");
const Middleware_1 = require("../lib/Utils/Middleware");
const Route = (0, express_1.Router)();
// Define roles
const ADMIN = "admin";
const INSTRUCTOR = "instructor";
const SCHOOL = "school";
const USER = "user";
// Mark video as watched
Route.post("/watched/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, INSTRUCTOR, SCHOOL, USER), watchedVideoController_1.markVideoAsWatched);
// Get all users who watched a specific video
Route.get("/watchedUsers/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, INSTRUCTOR), watchedVideoController_1.getWatchedUsers);
// Get all videos watched by the authenticated user
Route.get("/user/watched", Middleware_1.authenticate, watchedVideoController_1.getUserWatchedVideos);
exports.default = Route;
