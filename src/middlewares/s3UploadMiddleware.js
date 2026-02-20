import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { config } from "../constants/config.js";
import { ApiError } from "../utils/apiError.js";

// Initialize S3 Client
const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer-s3 storage
const s3Storage = multerS3({
  s3: s3Client,
  bucket: config.S3_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  },
});

// File filter function to validate file types
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
        400
      ),
      false
    );
  }
};

// Create multer upload instance
export const uploadToS3 = multer({
  storage: s3Storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

// Middleware for single file upload
export const uploadSingleFile = (fieldName) => {
  return (req, res, next) => {
    const upload = uploadToS3.single(fieldName);
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ApiError("File size exceeds 10MB limit", 400));
        }
        return next(new ApiError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

// Middleware for multiple files upload
export const uploadMultipleFiles = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const upload = uploadToS3.array(fieldName, maxCount);
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ApiError("File size exceeds 10MB limit", 400));
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(
            new ApiError(`Maximum ${maxCount} files allowed`, 400)
          );
        }
        return next(new ApiError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

// Middleware for multiple fields with files
export const uploadFields = (fields) => {
  return (req, res, next) => {
    const upload = uploadToS3.fields(fields);
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ApiError("File size exceeds 10MB limit", 400));
        }
        return next(new ApiError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};
