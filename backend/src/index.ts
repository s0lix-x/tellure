import express from "express";
import "dotenv/config";
import type { Request, Response } from "express";
import authRoutes from "./routes/auth.routes";
import cagesRoutes from "./routes/cages.routes";
import servicesRoutes from "./routes/services.routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Tellure Api Ready",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/v1/cages", cagesRoutes);

app.use("/api/v1/services", servicesRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
