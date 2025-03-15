import { Router } from "express";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";
import {
  getConversation,
  getMessageById,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/chatController";

const Route: Router = Router();

const ADMIN = "admin";
const SCHOOL = "school";
const INSTRUCTOR = "instructor";

Route.get(
  "/users",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL, INSTRUCTOR),
  getUsersForSidebar
);
Route.get(
  "/:id",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL, INSTRUCTOR),
  getConversation
);
Route.post(
  "/send/:id",
  authenticate,
  authorizeRoles(ADMIN, SCHOOL, INSTRUCTOR),
  sendMessage
);

export default Route;
