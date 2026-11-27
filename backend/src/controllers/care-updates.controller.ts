import { Request, Response } from "express";
import { db } from "../config/db";
import { careUpdates, bookings } from "../config/schema";
import { createCareUpdateSchema } from "../validations/care-update.validation";
import { eq } from "drizzle-orm";
import { uploadToCloudinary } from "../services/cloudinary.service";

interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

export const createCareUpdate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";

    if (!userId || !isAdmin) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Hanya admin yang boleh input jurnal.",
        });
    }

    const parsed = createCareUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Data tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, parsed.data.bookingId),
    });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking tidak ditemukan." });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Foto jurnal wajib diupload." });
    }

    // ✅ PANGGIL FUNGSI LO BENAR: cuma 1 argumen (Buffer)
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

    const [newUpdate] = await db
      .insert(careUpdates)
      .values({
        bookingId: parsed.data.bookingId,
        staffId: userId,
        type: parsed.data.type,
        note: parsed.data.note || "",
        photoUrl: cloudinaryResult.secure_url,
        photoPublicId: cloudinaryResult.public_id,
      })
      .$returningId();

    const updateDetail = await db.query.careUpdates.findFirst({
      where: eq(careUpdates.id, newUpdate.id),
    });

    return res.status(201).json({
      success: true,
      message: "Jurnal foto berhasil ditambahkan.",
      data: updateDetail,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};
