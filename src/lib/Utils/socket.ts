import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

interface UserSocketInfo {
  socketIds: string[];
  role: "Admin" | "Instructor" | "School";
}

const userSocketMap: Record<string, UserSocketInfo> = {};

// Function to get receiver's socket ID
export function getReceiverSocketId(userId: string): string | undefined {
  return userSocketMap[userId]?.socketIds[0]; // Return the first active socket ID
}

// Socket connection
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId as string;
  const role = socket.handshake.query.role as "Admin" | "Instructor" | "School";

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

    if (!sender || !receiver) return;

    if (
      (sender.role === "Admin" && ["Instructor", "School"].includes(receiver.role)) ||
      (["Instructor", "School"].includes(sender.role) && receiver.role === "Admin")
    ) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", { senderId, message });
      }
    } else {
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

export { io, app, server };
