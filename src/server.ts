import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import videoRoutes from "./routes/videoRoute";
import authRoutes from "./routes/authRoute";
import invoiceRoutes from "./routes/invoiceRoute";
import { connectDB } from "./lib/Utils/Connection";
import adminInvoiceApprovalRoute from "./routes/adminInvoiceApprovalRoute";
import adminVideoApprovalRoute from "./routes/adminVideoApporove";
import schoolRoute from "./routes/schoolRoute";
import userDonation from "./routes/donationRoute";
import libraryRoute from "./routes/libraryRoutes";
import watchedVideoRoute from "./routes/WatchedVideo";
import ProgramRoute from "./routes/ProgramRoutes";
import GalleryRoute from "./routes/GalleryRoute";
import chatRoutes from "./routes/chatRoute";
import { app, server } from "./lib/Utils/socket";
import path from "path";

dotenv.config();

// Mongodb Connection
connectDB();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://69.62.70.22:8000/"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/donations/webhook", express.raw({ type: "application/json" }));

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// api
app.use("/api/v1/user", authRoutes);
app.use("/api/v1/video", videoRoutes);
app.use("/api/v1/invoice", invoiceRoutes);
app.use("/api/v1/adminInvoiceApproval", adminInvoiceApprovalRoute);
app.use("/api/v1/adminVideoApproval", adminVideoApprovalRoute);
app.use("/api/v1/school", schoolRoute);
app.use("/api/v1/userDonation", userDonation);
app.use("/api/v1/library", libraryRoute);
app.use("/api/v1/watchedVideo", watchedVideoRoute);
app.use("/api/v1/gallery", GalleryRoute);
app.use("/api/v1/program", ProgramRoute);
app.use("/api/v1/chat", chatRoutes);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../build")));

app.use(function (req, res) {
  res.sendFile(path.join(__dirname, "../build", "index.html"));
});

server.listen(PORT, () => {
  console.log(`Server Started at PORT:- ${PORT}`);
});
