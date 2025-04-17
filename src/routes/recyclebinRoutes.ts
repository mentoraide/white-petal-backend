import { Router } from "express";
import {
  getAllRecycleItems,
  restoreVideo,
  permanentDeleteVideo,
} from "../controllers/RecycleBinVideoController";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

const ADMIN = "admin";
const INSTRUCTOR = "instructor";

const Route: Router = Router();

Route.get("/getAllRecycleVideos", authenticate, authorizeRoles(ADMIN, INSTRUCTOR),  getAllRecycleItems);
Route.post("/restoreRecycleVideos/:id",authenticate, authorizeRoles(ADMIN, INSTRUCTOR), restoreVideo);
Route.delete("/permanentDeleteRecycle/:id",authenticate, authorizeRoles(ADMIN, INSTRUCTOR), permanentDeleteVideo);

export default Route;
