import { Router } from "express";
import { createCage, getAllCages } from "../controllers/cages.controller";
import { isAdmin, verifyToken } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../middleware/upload.middleware";

const router = Router();

router.get("/", getAllCages);
router.post("/", verifyToken, isAdmin, uploadSingleImage, createCage);

export default router;