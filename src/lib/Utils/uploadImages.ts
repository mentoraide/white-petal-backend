import multer from "multer";

const uploadImages = multer({dest:"uploads/"});
export default uploadImages
