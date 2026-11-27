import { Router } from "express";
import {
  createCareUpdate,
  getCareUpdatesByBooking,
} from "../controllers/care-updates.controller";
import { verifyToken, isAdmin } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../middleware/upload.middleware";

const router = Router();

router.post("/", verifyToken, isAdmin, uploadSingleImage, createCareUpdate);
router.get("/", verifyToken, getCareUpdatesByBooking);

export default router;
