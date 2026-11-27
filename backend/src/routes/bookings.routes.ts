import { Router } from "express";
import { createBooking, getBookingById, getMyBookings } from "../controllers/bookings.controller";
import { create } from "node:domain";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/", verifyToken, createBooking);
router.get("/", verifyToken, getMyBookings);
router.get("/:id", verifyToken, getBookingById);

export default router;