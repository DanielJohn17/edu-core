import AgentAPI from "apminsight";
AgentAPI.config();

import "dotenv/config";
import cors from "cors";
import express from "express";
import { db } from "./db/db";
import { sql } from "drizzle-orm";
import subjectsRouter from "./routes/subject";
import usersRouter from "./routes/users";
import classesRouter from "./routes/classes";
import securityMiddleware from "./middleware/security";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const app = express();
const PORT = 8000;

const frontendUrl = process.env.FRONTEND_URL?.trim();
if (!frontendUrl) throw new Error("FRONTEND_URL is not defined");
if (frontendUrl === "*") {
  throw new Error("FRONTEND_URL cannot be '*' when credentials are enabled");
}
new URL(frontendUrl); // Throws if malformed
app.use(
  cors({
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use(securityMiddleware);

app.use("/api/subjects", subjectsRouter);
app.use("/api/users", usersRouter);
app.use("/api/classes", classesRouter);

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
