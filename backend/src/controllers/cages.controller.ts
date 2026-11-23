import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { cages } from "../config/schema";
import { uploadToCloudinary } from "../services/cloudinary.service";
import { createCageSchema } from "../validations/cage.validation";

export const createCage = async (req: Request, res: Response) => {
  try {
    const parsed = createCageSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Data tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Gambar harus diunggah.",
      });
    }

    const uploaded = await uploadToCloudinary(req.file.buffer);

    const [inserted] = await db
      .insert(cages)
      .values({
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
      })
      .$returningId();

    const newCage = await db.query.cages.findFirst({
      where: eq(cages.id, inserted.id),
    });

    return res.status(201).json({
      success: true,
      message: "Kandang berhasil dibuat.",
      data: { newCage },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};

export const getAllCages = async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(cages);

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil data kandang.",
      data: { data },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};
