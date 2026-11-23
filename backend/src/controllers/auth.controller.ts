import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { users } from "../config/schema";
import { registerSchema, loginSchema } from "../validations/auth.validation";

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: Invalid input data.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { username, email, phoneNumber, password } = parsed.data;

    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Conflict: Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "user", 
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: Invalid input data.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    const foundUsers = await db.select().from(users).where(eq(users.email, email));
    if (foundUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid email or password.",
      });
    }

    const user = foundUsers[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};