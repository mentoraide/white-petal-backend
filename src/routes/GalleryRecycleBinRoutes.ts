// routes/GalleryRecycleBinRoutes.ts
import { Router } from "express";
import {
  getAllRecycleItems,
  restoreImage,
  permanentDeleteImage,
} from "../controllers/GalleryRecycleBinController";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

const ADMIN = "admin";
const SCHOOL = "school";

const Route: Router = Router();


Route.get("/getAllRecycleImages", authenticate, authorizeRoles(ADMIN, SCHOOL), getAllRecycleItems);
Route.post("/restoreRecycleImage/:id", authenticate, authorizeRoles(ADMIN, SCHOOL), restoreImage);
Route.delete("/permanentDeleteRecycleImage/:id", authenticate, authorizeRoles(ADMIN, SCHOOL), permanentDeleteImage);

export default Route;
