import { Request, Response } from "express";
import { db } from "../config/db";
import {
  bookings,
  cages,
  services,
  bookingStatusHistory,
  careUpdates,
} from "../config/schema";
import { createBookingSchema } from "../validations/booking.validation";
import { eq, and, lt, gt, desc } from "drizzle-orm";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string; [key: string]: any };
}

export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Data tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const cage = await db.query.cages.findFirst({
      where: eq(cages.id, parsed.data.cageId),
    });
    if (!cage || !cage.isAvailable) {
      return res
        .status(404)
        .json({ success: false, message: "Kandang tidak tersedia." });
    }

    const checkIn = new Date(parsed.data.checkInDate);
    const checkOut = new Date(parsed.data.checkOutDate);
    const durationMs = checkOut.getTime() - checkIn.getTime();
    const durationDays = Math.ceil(durationMs / MILLISECONDS_PER_DAY);

    if (durationDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Tanggal checkout harus setelah checkin.",
      });
    }

    let totalPrice = cage.price * durationDays;
    if (parsed.data.serviceId) {
      const service = await db.query.services.findFirst({
        where: eq(services.id, parsed.data.serviceId),
      });
      if (service) totalPrice += service.price;
    }

    const conflict = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.cageId, parsed.data.cageId),
        lt(bookings.checkInDate, parsed.data.checkOutDate as string),
        gt(bookings.checkOutDate, parsed.data.checkInDate as string),
      ),
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "Kandang sudah dibooking di tanggal tersebut.",
      });
    }

    const [newBooking] = await db
      .insert(bookings)
      .values({
        userId,
        cageId: parsed.data.cageId,
        serviceId: parsed.data.serviceId || null,
        petName: parsed.data.petName,
        petType: parsed.data.petType,
        petDescription: parsed.data.petDescription || "",
        checkInDate: parsed.data.checkInDate,
        checkOutDate: parsed.data.checkOutDate,
        durationDays,
        totalPrice,
        status: "pending",
      })
      .$returningId();

    await db.insert(bookingStatusHistory).values({
      bookingId: newBooking.id,
      status: "pending",
      note: "Booking diajukan oleh user.",
    });

    const bookingDetail = await db.query.bookings.findFirst({
      where: eq(bookings.id, newBooking.id),
    });

    return res.status(201).json({
      success: true,
      message: "Booking berhasil diajukan.",
      data: bookingDetail,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};

export const getBookingById = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0)
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });

    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
    });
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking tidak ditemukan" });

    if (!isAdmin && booking.userId !== userId) {
      return res.status(403).json({ success: false, message: "Akses ditolak" });
    }

    const statusHistory = await db
      .select()
      .from(bookingStatusHistory)
      .where(eq(bookingStatusHistory.bookingId, id))
      .orderBy(desc(bookingStatusHistory.createdAt));

    const journals = await db
      .select()
      .from(careUpdates)
      .where(eq(careUpdates.bookingId, id))
      .orderBy(desc(careUpdates.createdAt));

    return res.status(200).json({
      success: true,
      message: "Detail booking berhasil diambil.",
      data: { ...booking, statusHistory, journals },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};

export const getMyBookings = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const statusFilter = req.query.status as string | undefined;

    let query = db.select().from(bookings).where(eq(bookings.userId, userId));

    if (
      statusFilter &&
      ["pending", "approved", "rejected", "completed", "cancelled"].includes(
        statusFilter,
      )
    ) {
      query = db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.userId, userId),
            eq(bookings.status, statusFilter as any),
          ),
        );
    }

    const myBookings = await query.orderBy(desc(bookings.createdAt));

    return res.status(200).json({
      success: true,
      message: "Daftar booking berhasil diambil.",
      data: { bookings: myBookings },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};
