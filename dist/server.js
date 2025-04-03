"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const videoRoute_1 = __importDefault(require("./routes/videoRoute"));
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const invoiceRoute_1 = __importDefault(require("./routes/invoiceRoute"));
const Connection_1 = require("./lib/Utils/Connection");
const adminInvoiceApprovalRoute_1 = __importDefault(require("./routes/adminInvoiceApprovalRoute"));
const adminVideoApporove_1 = __importDefault(require("./routes/adminVideoApporove"));
const schoolRoute_1 = __importDefault(require("./routes/schoolRoute"));
const donationRoute_1 = __importDefault(require("./routes/donationRoute"));
const libraryRoutes_1 = __importDefault(require("./routes/libraryRoutes"));
const WatchedVideo_1 = __importDefault(require("./routes/WatchedVideo"));
const ProgramRoutes_1 = __importDefault(require("./routes/ProgramRoutes"));
const GalleryRoute_1 = __importDefault(require("./routes/GalleryRoute"));
const chatRoute_1 = __importDefault(require("./routes/chatRoute"));
const socket_1 = require("./lib/Utils/socket");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
// Mongodb Connection
(0, Connection_1.connectDB)();
socket_1.app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "http://69.62.70.22:8000/"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
socket_1.app.use("/api/donations/webhook", express_1.default.raw({ type: "application/json" }));
//middleware
socket_1.app.use(express_1.default.json());
socket_1.app.use(express_1.default.urlencoded({ extended: true }));
socket_1.app.use((0, cookie_parser_1.default)());
// api
socket_1.app.use("/api/v1/user", authRoute_1.default);
socket_1.app.use("/api/v1/video", videoRoute_1.default);
socket_1.app.use("/api/v1/invoice", invoiceRoute_1.default);
socket_1.app.use("/api/v1/adminInvoiceApproval", adminInvoiceApprovalRoute_1.default);
socket_1.app.use("/api/v1/adminVideoApproval", adminVideoApporove_1.default);
socket_1.app.use("/api/v1/school", schoolRoute_1.default);
socket_1.app.use("/api/v1/userDonation", donationRoute_1.default);
socket_1.app.use("/api/v1/library", libraryRoutes_1.default);
socket_1.app.use("/api/v1/watchedVideo", WatchedVideo_1.default);
socket_1.app.use("/api/v1/gallery", GalleryRoute_1.default);
socket_1.app.use("/api/v1/program", ProgramRoutes_1.default);
socket_1.app.use("/api/v1/chat", chatRoute_1.default);
const PORT = process.env.PORT || 3000;
socket_1.app.use(express_1.default.static(path_1.default.join(__dirname, "../build")));
socket_1.app.use(function (req, res) {
    res.sendFile(path_1.default.join(__dirname, "../build", "index.html"));
});
socket_1.server.listen(PORT, () => {
    console.log(`Server Started at PORT:- ${PORT}`);
});
