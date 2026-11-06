import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `food-${uniqueSuffix}${ext}`);
  }
});

// File filter: images only
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /^\.(jpe?g|png|webp|gif)$/i;
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeImage = file.mimetype.startsWith("image/");
  const isExtValid = allowedExtensions.test(ext);

  if (isMimeImage && isExtValid) {
    return cb(null, true);
  }

  cb(new Error("Only image files (jpeg, jpg, png, webp, gif) are allowed."));
};

// Multer instance: max 2MB limit
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter
});

/**
 * Middleware wrapper to handle single image upload on field 'image'
 * Formats errors nicely into { success: false, message, data: null }
 */
export const uploadFoodImage = (req, res, next) => {
  const uploadSingle = upload.single("image");

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image file size exceeds the 2MB limit.",
          data: null
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
        data: null
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload image.",
        data: null
      });
    }

    next();
  });
};

export default uploadFoodImage;
