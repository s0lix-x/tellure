import { Router } from "express";
import { createBooking, getBookingById, getMyBookings, updateBookingStatus } from "../controllers/bookings.controller";
import { create } from "node:domain";
import { isAdmin, verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/", verifyToken, createBooking);
router.get("/", verifyToken, getMyBookings);
router.get("/:id", verifyToken, getBookingById);
router.patch("/:id/status", verifyToken, isAdmin, updateBookingStatus);

export default router;