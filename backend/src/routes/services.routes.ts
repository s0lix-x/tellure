import { Router } from "express";
import {
  createService,
  deleteService,
  getAllServices,
} from "../controllers/services.controller";
import { isAdmin, verifyToken } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../middleware/upload.middleware";

const router = Router();

router.get("/", getAllServices);
router.post("/", verifyToken, isAdmin, uploadSingleImage, createService);
router.delete("/", verifyToken, isAdmin, deleteService)

export default router;
