"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStudent = exports.deleteSchool = exports.updateSchool = exports.getSchoolById = exports.getAllSchools = exports.rejectSchool = exports.approveSchool = exports.createSchool = void 0;
const school_1 = __importDefault(require("../models/school"));
const user_1 = __importDefault(require("../models/user"));
// 1. Create a School (Approval Required)
const createSchool = (req, res) => {
    const schoolData = req.body;
    schoolData.isApproved = false;
    const school = new school_1.default(schoolData);
    school
        .save()
        .then((savedSchool) => {
        res.status(201).json({
            message: "School created successfully! Waiting for admin approval.",
            data: savedSchool,
            success: true
        });
    })
        .catch((error) => {
        res.status(500).json({
            message: "Error creating school",
            error,
            success: false
        });
    });
};
exports.createSchool = createSchool;
// 2. Approve a School (Admin Only)
const approveSchool = (req, res) => {
    const { schoolID } = req.params;
    school_1.default.findOneAndUpdate({ schoolID }, { isApproved: true }, { new: true })
        .then((updatedSchool) => {
        if (updatedSchool) {
            res.status(200).json({
                message: "School approved successfully!",
                data: updatedSchool,
                success: true
            });
        }
        else {
            res.status(404).json({
                message: "School not found",
                success: false
            });
        }
    })
        .catch((error) => {
        res.status(500).json({
            message: "Error approving school",
            error,
            success: false
        });
    });
};
exports.approveSchool = approveSchool;
// 7. Reject a School (Admin Only)
const rejectSchool = (req, res) => {
    const { schoolID } = req.params;
    school_1.default.findOneAndUpdate({ schoolID }, { isApproved: false }, { new: true })
        .then((rejectedSchool) => {
        if (rejectedSchool) {
            res.status(200).json({
                message: "School rejected successfully!",
                data: rejectedSchool,
                success: true
            });
        }
        else {
            res.status(404).json({
                message: "School not found",
                success: false
            });
        }
    })
        .catch((error) => {
        res.status(500).json({
            message: "Error rejecting school",
            error,
            success: false
        });
    });
};
exports.rejectSchool = rejectSchool;
// 3. Get All Approved Schools
const getAllSchools = (req, res) => {
    school_1.default.aggregate([
        { $match: { isApproved: true } }, // Only fetch approved schools
        {
            $project: {
                schoolName: 1,
                schoolID: 1,
                isApproved: 1, // Include isApproved in the response
            }
        }
    ])
        .then((schools) => {
        res.status(200).json({
            message: "Approved schools fetched successfully!",
            data: schools,
            success: true
        });
    })
        .catch((error) => {
        res.status(500).json({
            message: "Error fetching schools",
            error,
            success: false
        });
    });
};
exports.getAllSchools = getAllSchools;
// 4. Get a Single Approved School by ID
const getSchoolById = (req, res) => {
    const { schoolID } = req.params;
    school_1.default.aggregate([
        { $match: { schoolID, isApproved: true } }, // Only fetch approved schools
        {
            $project: {
                schoolName: 1,
                schoolID: 1,
                headOfSchool: 1,
                address: 1,
                contact: 1,
                message: 1,
                createdAt: 1,
                updatedAt: 1,
                isApproved: 1, // Include isApproved in the response
            }
        }
    ])
        .then((school) => {
        if (school.length > 0) {
            res.status(200).json({
                message: "School fetched successfully!",
                data: school[0],
                success: true
            });
        }
        else {
            res.status(404).json({
                message: "School not found or not approved",
                success: false
            });
        }
    })
        .catch((error) => {
        res.status(500).json({
            message: "Error fetching school",
            error,
            success: false
        });
    });
};
exports.getSchoolById = getSchoolById;
// 5. Update a School (Before Approval)
const updateSchool = (req, res) => {
    const { schoolID } = req.params;
    const updatedData = req.body;
    school_1.default.findOneAndUpdate({ schoolID }, updatedData, { new: true })
        .then((updatedSchool) => {
        if (!updatedSchool) {
            return res.status(404).json({
                message: "School not found",
                success: false
            });
        }
        res.status(200).json({
            message: "School updated successfully!",
            data: updatedSchool,
            success: true
        });
    })
        .catch((error) => {
        console.error("Error updating school:", error);
        res.status(500).json({
            message: "Error updating school",
            error,
            success: false
        });
    });
};
exports.updateSchool = updateSchool;
// 6. Delete a School (Before Approval)
const deleteSchool = (req, res) => {
    const { schoolID } = req.params;
    console.log("Deleting School:", schoolID);
    school_1.default.findOneAndDelete({ schoolID })
        .then((deletedSchool) => {
        if (!deletedSchool) {
            return res.status(404).json({
                message: "School not found",
                success: false
            });
        }
        res.status(200).json({
            message: "School deleted successfully!",
            data: deletedSchool,
            success: true
        });
    })
        .catch((error) => {
        console.error("Error deleting school:", error);
        res.status(500).json({
            message: "Error deleting school",
            error,
            success: false
        });
    });
};
exports.deleteSchool = deleteSchool;
// 7. Fet all student related to school
const getAllStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const schoolId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get school ID from logged-in user
        if (!schoolId) {
            res.status(400).json({ message: "School ID not found in request" });
            return;
        }
        const students = yield user_1.default.find({ schoolID: schoolId, role: "user" });
        res.status(200).json({
            message: "Students retrieved successfully",
            data: students,
        });
    }
    catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getAllStudent = getAllStudent;
