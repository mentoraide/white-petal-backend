"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Middleware_1 = require("../lib/Utils/Middleware");
const adminVideoController_1 = require("../controllers/adminVideoController");
const Route = (0, express_1.Router)();
Route.put("/approve/video/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)("admin"), adminVideoController_1.approveVideo);
Route.put("/reject/video/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)("admin"), adminVideoController_1.rejectVideo);
exports.default = Route;
