import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./Cloundinary"; 

// Storage configuration for video and thumbnail
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const folder = file.fieldname === "video" ? "instructor_videos" : "thumbnails";
        return {
            folder,
            resource_type: file.fieldname === "video" ? "video" : "image",
            transformation: file.fieldname === "thumbnail" ? [{ width: 300, height: 200, crop: "fill" }] : [],
        };
    },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (file.fieldname === "video" && !file.mimetype.startsWith("video/")) {
        return cb(new Error("Only video files are allowed!"), false);
    }
    if (file.fieldname === "thumbnail" && !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed for thumbnail!"), false);
    }
    cb(null, true);
};


// Multer middleware
const upload = multer({ storage, fileFilter }).fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
]);


export { upload };

