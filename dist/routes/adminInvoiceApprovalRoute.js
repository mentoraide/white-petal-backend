"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Middleware_1 = require("../lib/Utils/Middleware");
const adminInvoiceController_1 = require("../controllers/adminInvoiceController");
const Route = (0, express_1.Router)();
Route.put("/approve/invoice/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)("admin"), adminInvoiceController_1.approveInvoice);
Route.put("/reject/invoice/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)("admin"), adminInvoiceController_1.rejectInvoice);
exports.default = Route;
