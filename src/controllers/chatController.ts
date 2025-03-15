import { Response, Request } from "express";
import mongoose, { Document } from "mongoose";
import Message from "../models/message";
import { getReceiverSocketId, io } from "../lib/Utils/socket";
import User from "../models/user";
import { IUser } from "../models/user";

// Define the authenticated request interface
export interface AuthenticatedRequest extends Request {
  user: Document & InstanceType<typeof User>;
}

interface AuthRequest extends Request {
  user?: IUser;
}

export const sendMessage = (req: Request, res: Response): void => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const senderId: string = String(authReq.user._id);
  const receiverId: string = req.params.id;
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
  Promise.all([User.findById(senderId), User.findById(receiverId)])
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
      const newMessage = new Message({
        senderId,
        receiverId,
        text,
      });

      return newMessage.save();
    })
    .then((savedMessage) => {
      if (savedMessage) {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", savedMessage);
        }

        res.status(200).json({
          message: "Message sent successfully",
          data: savedMessage,
        });
      }
    })
    .catch((error: any) => {
      console.error("Error saving message:", error);
      res.status(500).json({ error: error.message || "Server error" });
    });
};

// Get Messages
export const getMessageById = (req: Request, res: Response): void => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const loggedInUserId = String(authReq.user._id);
  const loggedInUserRole = authReq.user.role;
  const messageId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    res.status(400).json({ error: "Invalid message ID" });
    return;
  }

  Message.findById(messageId)
    .populate("senderId", "role")
    .populate("receiverId", "role")
    .then((message) => {
      if (!message) {
        res.status(404).json({ error: "Message not found" });
        return;
      }

      const sender = message.senderId as unknown as IUser;
      const receiver = message.receiverId as unknown as IUser;

      // Check if the logged-in user is a participant in the conversation
      const isParticipant =
        String(sender._id) === loggedInUserId ||
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
    .catch((error: any) => {
      console.error("Error fetching message by ID:", error);
      res.status(500).json({ error: "Internal server error" });
    });
};

export const getUsersForSidebar = (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const loggedInUserId = authReq.user._id;
  const loggedInUserRole = authReq.user.role;

  let filter: any = { _id: { $ne: loggedInUserId } };

  // Apply role-based filtering
  if (loggedInUserRole === "admin") {
    filter.role = { $in: ["instructor", "school"] };
  } else if (["instructor", "school"].includes(loggedInUserRole)) {
    filter.role = "admin"; // Instructors and Schools should only see Admins
  }

  User.find(filter)
    .select("name email role") // Exclude sensitive info
    .then((filteredUsers) => {
      res.status(200).json(filteredUsers);
    })
    .catch((error: any) => {
      console.error("Error in getUsersForSidebar: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    });
};
export const getConversation = (req: Request, res: Response): void => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const senderId = String(authReq.user._id); // Logged in user is the sender
  const receiverId = req.params.id; // User ID from route parameter
  const loggedInUserRole = authReq.user.role;

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    res.status(400).json({ error: "Invalid receiver ID" });
    return;
  }

  // First verify if the users can message each other based on roles
  User.findById(receiverId)
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
      return Message.find({
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
    .catch((error: any) => {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    });
};
