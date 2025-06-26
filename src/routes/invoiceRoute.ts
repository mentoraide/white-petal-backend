import { Router } from "express";
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoicePDF,
  getInvoices,
  updateInvoice,
} from "../controllers/invoiceController";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

const Route: Router = Router();

Route.post(
  "/create-invoice",
  authenticate,
  authorizeRoles("instructor"),
  createInvoice
);
Route.get(
  "/getInvoices",
  authenticate,
  authorizeRoles("instructor", "admin"),
  getInvoices
);
Route.get(
  "/getSingleInvoices/:invoiceId",
  authenticate,
  authorizeRoles("instructor"),
  getInvoiceById
);
Route.put(
  "/updateInvoices/:invoiceId",
  authenticate,
  authorizeRoles("instructor"),
  updateInvoice
);
Route.delete(
  "/deleteInvoices/:invoiceId",
  authenticate,
  authorizeRoles("instructor"),
  deleteInvoice
);

Route.get("/invoice/:invoiceId/pdf",  authenticate,
  authorizeRoles("instructor"), getInvoicePDF);
export default Route;

