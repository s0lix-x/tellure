import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { cages } from "../config/schema";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../services/cloudinary.service";
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
        description: parsed.data.description || "",
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
      data: { cages: data },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};

export const getCageById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Id tidak valid",
      });
    }

    const cage = await db.query.cages.findFirst({ where: eq(cages.id, id) });

    if (!cage) {
      return res.status(404).json({
        success: false,
        message: "Kandang tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Detail kandang berhasil diambil.",
      data: { cage: cage },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};

export const deleteCage = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Id tidak valid",
      });
    }

    const cage = await db.query.cages.findFirst({ where: eq(cages.id, id) });

    if (!cage) {
      return res.status(404).json({
        success: false,
        message: "Kandang tidak ditemukan",
      });
    }

    await db.delete(cages).where(eq(cages.id, id));

    if (cage.imagePublicId) {
      try {
        await deleteFromCloudinary(cage.imagePublicId);
      } catch (error) {
        console.error("Gagal hapus gambar Cloudinary", error);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Kandang berhasil dihapus.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};

export const updateCage = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Id tidak valid",
      });
    }

    const cage = await db.query.cages.findFirst({
      where: eq(cages.id, id),
    });

    if (!cage) {
      return res.status(404).json({
        success: false,
        message: "Kandang tidak ditemukan",
      });
    }

    const parsed = createCageSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Data tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    let imageUrl = cage.imageUrl;
    let imagePublicId = cage.imagePublicId;

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer);
      await deleteFromCloudinary(cage.imagePublicId);
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    }

    await db
      .update(cages)
      .set({
        name: parsed.data.name ?? cage.name,
        price: parsed.data.price ?? cage.price,
        description: parsed.data.description ?? cage.description,
        acceptedTypes: parsed.data.acceptedTypes ?? cage.acceptedTypes,
        isAvailable: parsed.data.isAvailable ?? cage.isAvailable,
        imageUrl,
        imagePublicId,
      })
      .where(eq(cages.id, id));

    const updatedCage = await db.query.cages.findFirst({
      where: eq(cages.id, id),
    });

    return res.status(200).json({
      success: true,
      message: "Kandang berhasil diupdate.",
      data: updatedCage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};