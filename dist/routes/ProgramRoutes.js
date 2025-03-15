"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const programController_1 = require("../controllers/programController");
const Middleware_1 = require("../lib/Utils/Middleware");
const ADMIN = "admin";
const SCHOOL = "school";
const router = express_1.default.Router();
router.post("", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), programController_1.requestProgram);
router.get("/allPrograms", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN, SCHOOL), programController_1.getAllProgramRequests);
router.put("/:id", Middleware_1.authenticate, (0, Middleware_1.authorizeRoles)(ADMIN), programController_1.updateProgramStatus);
exports.default = router;
