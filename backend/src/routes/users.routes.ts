import { Router } from "express";
import { getMe } from "../controllers/users.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", verifyToken, getMe);

export default router;
