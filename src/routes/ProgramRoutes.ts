import express from "express";
import { requestProgram, getAllProgramRequests, updateProgramStatus, } from "../controllers/programController";
import { authenticate, authorizeRoles } from "../lib/Utils/Middleware";

const ADMIN = "admin";
const SCHOOL = "school";

const router = express.Router();

router.post("", authenticate,authorizeRoles(ADMIN, SCHOOL), requestProgram);
router.get("/allPrograms", authenticate, authorizeRoles(ADMIN, SCHOOL), getAllProgramRequests);
router.put("/:id", authenticate, authorizeRoles(ADMIN), updateProgramStatus);

export default router;
