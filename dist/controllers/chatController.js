"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversation = exports.getUsersForSidebar = exports.getMessageById = exports.sendMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const message_1 = __importDefault(require("../models/message"));
const socket_1 = require("../lib/Utils/socket");
const user_1 = __importDefault(require("../models/user"));
const sendMessage = (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const senderId = String(authReq.user._id);
    const receiverId = req.params.id;
    const { text } = req.body;
    if (!receiverId || typeof receiverId !== "string") {
        res.status(400).json({ error: "Invalid receiverId" });
        return;
    }
    if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Message text is required" });
        return;
    }
    // Fetch sender and receiver details to check roles
    Promise.all([user_1.default.findById(senderId), user_1.default.findById(receiverId)])
        .then(([sender, receiver]) => {
        if (!sender || !receiver) {
            return Promise.reject(new Error("Sender or receiver not found"));
        }
        // Permission rules
        if (sender.role === "school" && receiver.role !== "admin") {
            return Promise.reject(new Error("Schools can only message Admins"));
        }
        if (sender.role === "instructor" && receiver.role !== "admin") {
            return Promise.reject(new Error("Instructors can only message Admins"));
        }
        // Admin has no restrictions
        const newMessage = new message_1.default({
            senderId,
            receiverId,
            text,
        });
        return newMessage.save();
    })
        .then((savedMessage) => {
        if (savedMessage) {
            const receiverSocketId = (0, socket_1.getReceiverSocketId)(receiverId);
            if (receiverSocketId) {
                socket_1.io.to(receiverSocketId).emit("newMessage", savedMessage);
            }
            res.status(200).json({
                message: "Message sent successfully",
                data: savedMessage,
            });
        }
    })
        .catch((error) => {
        console.error("Error saving message:", error);
        res.status(500).json({ error: error.message || "Server error" });
    });
};
exports.sendMessage = sendMessage;
// Get Messages
const getMessageById = (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const loggedInUserId = String(authReq.user._id);
    const loggedInUserRole = authReq.user.role;
    const messageId = req.params.id;
    if (!mongoose_1.default.Types.ObjectId.isValid(messageId)) {
        res.status(400).json({ error: "Invalid message ID" });
        return;
    }
    message_1.default.findById(messageId)
        .populate("senderId", "role")
        .populate("receiverId", "role")
        .then((message) => {
        if (!message) {
            res.status(404).json({ error: "Message not found" });
            return;
        }
        const sender = message.senderId;
        const receiver = message.receiverId;
        // Check if the logged-in user is a participant in the conversation
        const isParticipant = String(sender._id) === loggedInUserId ||
            String(receiver._id) === loggedInUserId;
        if (!isParticipant) {
            res.status(403).json({ error: "Access denied" });
            return;
        }
        // Restrict visibility based on roles
        if (["school", "instructor"].includes(loggedInUserRole)) {
            if (sender.role !== "admin" && receiver.role !== "admin") {
                res
                    .status(403)
                    .json({ error: "You can only access messages with Admins" });
                return;
            }
        }
        res.status(200).json(message);
    })
        .catch((error) => {
        console.error("Error fetching message by ID:", error);
        res.status(500).json({ error: "Internal server error" });
    });
};
exports.getMessageById = getMessageById;
const getUsersForSidebar = (req, res) => {
    const authReq = req;
    const loggedInUserId = authReq.user._id;
    const loggedInUserRole = authReq.user.role;
    let filter = { _id: { $ne: loggedInUserId } };
    // Apply role-based filtering
    if (loggedInUserRole === "admin") {
        filter.role = { $in: ["instructor", "school"] };
    }
    else if (["instructor", "school"].includes(loggedInUserRole)) {
        filter.role = "admin"; // Instructors and Schools should only see Admins
    }
    user_1.default.find(filter)
        .select("name email role") // Exclude sensitive info
        .then((filteredUsers) => {
        res.status(200).json(filteredUsers);
    })
        .catch((error) => {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    });
};
exports.getUsersForSidebar = getUsersForSidebar;
const getConversation = (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const senderId = String(authReq.user._id); // Logged in user is the sender
    const receiverId = req.params.id; // User ID from route parameter
    const loggedInUserRole = authReq.user.role;
    if (!mongoose_1.default.Types.ObjectId.isValid(receiverId)) {
        res.status(400).json({ error: "Invalid receiver ID" });
        return;
    }
    // First verify if the users can message each other based on roles
    user_1.default.findById(receiverId)
        .then((receiver) => {
        if (!receiver) {
            return Promise.reject(new Error("Receiver not found"));
        }
        // Check permission rules
        if (loggedInUserRole === "school" && receiver.role !== "admin") {
            return Promise.reject(new Error("Schools can only message Admins"));
        }
        if (loggedInUserRole === "instructor" && receiver.role !== "admin") {
            return Promise.reject(new Error("Instructors can only message Admins"));
        }
        if (receiver.role === "school" && loggedInUserRole !== "admin") {
            return Promise.reject(new Error("Only Admins can message Schools"));
        }
        if (receiver.role === "instructor" && loggedInUserRole !== "admin") {
            return Promise.reject(new Error("Only Admins can message Instructors"));
        }
        // If permissions are valid, get messages
        return message_1.default.find({
            $or: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        })
            .sort({ createdAt: 1 }) // Sort by creation time ascending
            .populate("senderId", "name role") // Get sender name and role
            .populate("receiverId", "name role"); // Get receiver name and role
    })
        .then((messages) => {
        res.status(200).json(messages);
    })
        .catch((error) => {
        console.error("Error fetching conversation:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    });
};
exports.getConversation = getConversation;
