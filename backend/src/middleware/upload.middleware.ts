import multer from "multer";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();

const allowedFileTypes = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!allowedFileTypes.includes(file.mimetype)) {
      return cb(new Error("Hanya jpg, png, dan webp yang diperbolehkan!"));
    }
    cb(null, true);
  },
});

export const uploadSingleImage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload.single("image")(req, res, (err: any) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ success: false, message: "Ukuran file maksimal 5 MB." });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};
