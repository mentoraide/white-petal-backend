import { Router } from "express";
import { 
    markVideoAsWatched, 
    getWatchedUsers, 
    getUserWatchedVideos 
} from "../controllers/watchedVideoController";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

const Route: Router = Router();

// Define roles
const ADMIN = "admin";
const INSTRUCTOR = "instructor";
const SCHOOL = "school";
const USER = "user";

// Mark video as watched
Route.post("/watched/:id", authenticate,authorizeRoles(ADMIN,INSTRUCTOR,SCHOOL,USER), markVideoAsWatched);

// Get all users who watched a specific video
Route.get("/watchedUsers/:id",authenticate,authorizeRoles(ADMIN,INSTRUCTOR), getWatchedUsers);

// Get all videos watched by the authenticated user
Route.get("/user/watched", authenticate,getUserWatchedVideos);

export default Route;
