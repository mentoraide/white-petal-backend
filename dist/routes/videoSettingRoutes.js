"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoSettingController_1 = require("../controllers/videoSettingController");
const Middleware_1 = require("../lib/Utils/Middleware");
const Route = (0, express_1.Router)();
const ADMIN = "admin";
Route.post("/createVideosetting", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), videoSettingController_1.createVideoSetting);
Route.get("/getVideosetting", videoSettingController_1.getVideoSetting); // frontend use
Route.get("/getVideoSettingById/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), videoSettingController_1.getVideoSettingById);
Route.put("/updateVideosetting/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), videoSettingController_1.updateVideoSettingById);
Route.delete("/deleteVideoSetting/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), videoSettingController_1.deleteVideoSettingById); // delete by ID
exports.default = Route;
