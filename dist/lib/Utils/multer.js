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
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const Cloundinary_1 = __importDefault(require("./Cloundinary"));
// Storage configuration for video and thumbnail
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: Cloundinary_1.default,
    params: (req, file) => __awaiter(void 0, void 0, void 0, function* () {
        const folder = file.fieldname === "video" ? "instructor_videos" : "thumbnails";
        return {
            folder,
            resource_type: file.fieldname === "video" ? "video" : "image",
            transformation: file.fieldname === "thumbnail" ? [{ width: 300, height: 200, crop: "fill" }] : [],
        };
    }),
});
// File filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "video" && !file.mimetype.startsWith("video/")) {
        return cb(new Error("Only video files are allowed!"), false);
    }
    if (file.fieldname === "thumbnail" && !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed for thumbnail!"), false);
    }
    cb(null, true);
};
// Multer middleware
const upload = (0, multer_1.default)({ storage, fileFilter }).fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
]);
exports.upload = upload;
