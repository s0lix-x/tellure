import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized: Access token is required.",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
      role: string;
    };
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Forbidden: Invalid or expired token.",
    });
  }
};

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Forbidden: Admin privileges are required.",
    });
  }
  next();
};
