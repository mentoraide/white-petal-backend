import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "./s3";

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

// ✅ Updated file filter to allow images & PDFs
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image and PDF files are allowed!"));
  }
};

// ✅ Choose dynamic path (images or pdfs)
const getKey = (_req: any, file: Express.Multer.File, cb: Function) => {
  const fileType = file.mimetype.startsWith("image/") ? "images" : "pdfs";
  const filename = `${fileType}/${Date.now()}_${file.originalname}`;
  cb(null, filename);
};

// ✅ Unified upload middleware
export const upload = multer({
  fileFilter,
  storage: multerS3({
    s3,
    bucket: bucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (_req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: getKey,
  }),
});
