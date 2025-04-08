import { Router } from "express";
import {
  createVideoSetting,
  getVideoSetting,
  getVideoSettingById,
  updateVideoSettingById,
  deleteVideoSettingById
} from "../controllers/videoSettingController";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

const Route: Router = Router();

const ADMIN = "admin";

Route.post("/createVideosetting",authenticate, authorizeRoles(ADMIN), createVideoSetting);
Route.get("/getVideosetting", getVideoSetting); // frontend use
Route.get("/getVideoSettingById/:id", authenticate, authorizeRoles(ADMIN), getVideoSettingById);
Route.put("/updateVideosetting/:id",authenticate, authorizeRoles(ADMIN),  updateVideoSettingById);
Route.delete("/deleteVideoSetting/:id",authenticate, authorizeRoles(ADMIN),  deleteVideoSettingById); // delete by ID

export default Route;
