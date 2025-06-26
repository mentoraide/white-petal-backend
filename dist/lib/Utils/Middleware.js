"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../../models/user"));
const ResponseCode_1 = require("../Utils/ResponseCode");
// Verify JWT and set `req.user` using Promises
const authenticate = (req, res, next) => {
    var _a, _b;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(ResponseCode_1.ResponseCode.UNAUTHORIZED).json({ message: "No token provided" });
        return;
    }
    jsonwebtoken_1.default.verify(token, (_b = process.env.JWT_SECRET) !== null && _b !== void 0 ? _b : "", (err, decoded) => {
        if (err || !decoded || typeof decoded !== "object" || !("id" in decoded)) {
            res.status(ResponseCode_1.ResponseCode.UNAUTHORIZED).json({ message: "Invalid token" });
            return;
        }
        user_1.default.findById(decoded.id)
            .then((user) => {
            if (!user) {
                res.status(ResponseCode_1.ResponseCode.UNAUTHORIZED).json({ message: "User not found" });
                return;
            }
            req.user = user;
            next();
        })
            .catch(() => res.status(ResponseCode_1.ResponseCode.SERVER_ERROR).json({ message: "Server error" }));
    });
};
exports.authenticate = authenticate;
// Role-based access control middleware using Promises
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(ResponseCode_1.ResponseCode.FORBIDDEN).json({ status: false, message: "Access denied" });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
