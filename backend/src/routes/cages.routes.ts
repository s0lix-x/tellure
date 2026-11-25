import { Router } from "express";
import {
  createCage,
  deleteCage,
  getAllCages,
  getCageById,
  updateCage,
} from "../controllers/cages.controller";
import { isAdmin, verifyToken } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../middleware/upload.middleware";

const router = Router();

router.get("/", getAllCages);
router.get("/:id", getCageById)
router.post("/", verifyToken, isAdmin, uploadSingleImage, createCage);
router.put("/:id", verifyToken, isAdmin, uploadSingleImage, updateCage);
router.delete("/:id", verifyToken, isAdmin, deleteCage);

export default router;
