import express from "express";
import { db } from "../db/db";
import { classes, subjects } from "../db/schema";
import { and, ilike, or, eq, desc } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { count } from "drizzle-orm";

const classesRouter = express.Router();

classesRouter.get("/", async (req, res) => {
  const { search, subject, page = 1, limit = 10 } = req.query;

  const parsedPage = Number.parseInt(String(page), 10);
  const parsedLimit = Number.parseInt(String(limit), 10);

  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limitPerPage =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : 10;

  const offset = (currentPage - 1) * limitPerPage;

  const filterCondition = [];

  if (search) {
    filterCondition.push(
      or(
        ilike(classes.name, `%${search}%`),
        ilike(classes.inviteCode, `%${search}%`),
      ),
    );
  }

  if (subject) {
    filterCondition.push(
      ilike(subjects.name, `%${String(subject).replace(/([%_\\])/g, "\\$&")}%`),
    );
  }

  const whereClause =
    filterCondition.length > 0 ? and(...filterCondition) : undefined;

  const countResult = await db
    .select({ count: count() })
    .from(classes)
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .where(whereClause);

  const totalCount = countResult[0]?.count ?? 0;

  const classList = await db
    .select({
      ...getTableColumns(classes),
      subjects: {
        ...getTableColumns(subjects),
      },
    })
    .from(classes)
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .where(whereClause)
    .orderBy(desc(classes.createdAt))
    .limit(limitPerPage)
    .offset(offset);

  return res.status(200).json({
    data: classList,
    pagination: {
      page: currentPage,
      limit: limitPerPage,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitPerPage),
    },
  });
});

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
