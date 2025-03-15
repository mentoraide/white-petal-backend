import { Router } from "express";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";
import { approveVideo, rejectVideo } from "../controllers/adminVideoController";

const Route: Router = Router()

Route.put("/approve/video/:id", authenticate,authorizeRoles("admin"), approveVideo);
Route.put("/reject/video/:id",authenticate,authorizeRoles("admin"),rejectVideo);


export default Route;
