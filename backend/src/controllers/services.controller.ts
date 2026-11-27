import { Request, Response } from "express";
import { createServiceSchema } from "../validations/service.validation";
import { db } from "../config/db";
import { services } from "../config/schema";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../services/cloudinary.service";
import { eq } from "drizzle-orm";

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(services);

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil semua layanan.",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const parsed = createServiceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Data tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    }

    const [inserted] = await db
      .insert(services)
      .values({
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description || "",
        imageUrl,
        imagePublicId,
      })
      .$returningId();

    const newServices = await db.query.services.findFirst({
      where: eq(services.id, inserted.id),
    });

    return res.status(201).json({
      success: true,
      message: "Services berhasil dibuat.",
      data: newServices,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const service = await db.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!service)
      return res
        .status(404)
        .json({ success: false, message: "Layanan tidak ditemukan" });

    if (service.imagePublicId) {
      await deleteFromCloudinary(service.imagePublicId);
    }

    await db.delete(services).where(eq(services.id, id));

    return res
      .status(200)
      .json({ success: true, message: "Layanan berhasil dihapus" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};
