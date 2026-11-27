import { Router } from "express";
import { createCareUpdate } from "../controllers/care-updates.controller";
import { verifyToken, isAdmin } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../middleware/upload.middleware";

const router = Router();

router.post("/", verifyToken, isAdmin, uploadSingleImage, createCareUpdate);

export default router;
