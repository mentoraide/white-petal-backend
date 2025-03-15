"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = exports.io = void 0;
exports.getReceiverSocketId = getReceiverSocketId;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
    },
});
exports.io = io;
const userSocketMap = {};
// Function to get receiver's socket ID
function getReceiverSocketId(userId) {
    var _a;
    return (_a = userSocketMap[userId]) === null || _a === void 0 ? void 0 : _a.socketIds[0]; // Return the first active socket ID
}
// Socket connection
io.on("connection", (socket) => {
    console.log("A user connected", socket.id);
    const userId = socket.handshake.query.userId;
    const role = socket.handshake.query.role;
    if (userId && role) {
        if (!userSocketMap[userId]) {
            userSocketMap[userId] = { socketIds: [], role };
        }
        userSocketMap[userId].socketIds.push(socket.id);
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    // Handle private messaging with role-based restrictions
    socket.on("sendMessage", ({ senderId, receiverId, message }) => {
        const sender = userSocketMap[senderId];
        const receiver = userSocketMap[receiverId];
        if (!sender || !receiver)
            return;
        if ((sender.role === "Admin" && ["Instructor", "School"].includes(receiver.role)) ||
            (["Instructor", "School"].includes(sender.role) && receiver.role === "Admin")) {
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receiveMessage", { senderId, message });
            }
        }
        else {
            io.to(sender.socketIds).emit("errorMessage", "You are not allowed to message this user.");
        }
    });
    // Handle "typing" indicator
    socket.on("typing", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", { senderId: userId });
        }
    });
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        if (userId && userSocketMap[userId]) {
            userSocketMap[userId].socketIds = userSocketMap[userId].socketIds.filter(id => id !== socket.id);
            if (userSocketMap[userId].socketIds.length === 0) {
                delete userSocketMap[userId];
            }
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});
