import express from "express";
import { db } from "../db/db";
import { classes } from "../db/schema";

const classesRouter = express.Router();

classesRouter.post("/", async (req, res) => {
  try {
    const [createdClass] = await db
      .insert(classes)
      .values({
        ...req.body,
        inviteCode: Math.random().toString(36).substring(2, 9),
        schedules: [],
      })
      .returning({ id: classes.id });

    if (!createdClass) throw Error;

    res.status(201).json({ data: createdClass });
  } catch (err) {
    console.error(`POST /classes error: ${err}`);
    res.status(500).json({ error: "Failed to create class" });
  }
});

export default classesRouter;
