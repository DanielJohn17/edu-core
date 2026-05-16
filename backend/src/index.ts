import "dotenv/config";
import express from "express";
import { db } from "./db/db";

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Edu-Core API is running." });
});

app.get("/health", async (_req, res) => {
  try {
    const result = await db.execute("SELECT 1");
    res.json({ status: "healthy", database: "connected", result });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
