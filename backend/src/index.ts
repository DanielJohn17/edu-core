import "dotenv/config";
import cors from "cors";
import express from "express";
import { db } from "./db/db";
import { sql } from "drizzle-orm";
import subjectsRouter from "./routes/subject";

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) throw new Error("FRONTEND_URL is not defined");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/subjects", subjectsRouter);

app.get("/", (_req, res) => {
  res.json({ message: "Edu-Core API is running." });
});

app.get("/health", async (_req, res) => {
  try {
    const result = await db.execute(sql`SELECT 1`);
    res.json({ status: "healthy", database: "connected", result });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
