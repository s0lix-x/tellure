import { Request, Response } from "express";
import { db } from "../config/db";
import { users } from "../config/schema";
import { eq } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan" });

    const { password, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "Data profil berhasil diambil.",
      data: safeUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};