import { Router } from "express";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";
import {
  approveInvoice,
  rejectInvoice,
} from "../controllers/adminInvoiceController";

const Route: Router = Router();


Route.put(
  "/approve/invoice/:id",
  authenticate,
  authorizeRoles("admin"),
  approveInvoice
);
Route.put(
  "/reject/invoice/:id",
  authenticate,
  authorizeRoles("admin"),
  rejectInvoice
);

export default Route;
