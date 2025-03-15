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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProgramStatus = exports.getAllProgramRequests = exports.requestProgram = void 0;
const Program_1 = require("../models/Program");
const requestProgram = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contactPerson, email, phone, programRequested, message } = req.body;
        const newRequest = new Program_1.ProgramRequestModel({
            schoolName: req.user.name,
            contactPerson,
            schoolID: req.user.id,
            email,
            phone,
            programRequested,
            message,
            requestedBy: req.user.id, // Assuming req.user is populated
        });
        yield newRequest.save();
        res.status(201).json({ message: "Program request submitted successfully", data: newRequest });
    }
    catch (error) {
        console.log("errrr", error);
        res.status(500).json({ message: "Server error, some feilds are missing" });
    }
});
exports.requestProgram = requestProgram;
const getAllProgramRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user.role == "school") {
            const requests = yield Program_1.ProgramRequestModel.find({ schoolID: req.user.id });
            res.json({ message: "Program requests retrieved", data: requests });
        }
        else {
            const requests = yield Program_1.ProgramRequestModel.find({ status: "pending" }).populate("requestedBy", "name email");
            res.json({ message: "Program requests retrieved", data: requests });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
exports.getAllProgramRequests = getAllProgramRequests;
const updateProgramStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log("id---", id, status);
        if (!["approved", "rejected"].includes(status)) {
            res.status(400).json({ message: "Invalid status value" });
            return;
        }
        const updatedRequest = yield Program_1.ProgramRequestModel.findByIdAndUpdate(id, { status }, { new: true });
        console.log("in loggsss", updatedRequest);
        if (!updatedRequest) {
            res.status(404).json({ message: "Program request not found" });
            return;
        }
        res.json({ message: `Program request ${status}`, data: updatedRequest });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
exports.updateProgramStatus = updateProgramStatus;
