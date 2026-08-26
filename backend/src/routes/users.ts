import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express from "express";
import { user } from "../db/schema";
import { db } from "../db/db";

const usersRouter = express.Router();

// Get all users with optional search, filtering and pagination
usersRouter.get("/", async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

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

    // If search query exists, filter by user name or user email
    if (search) {
      filterCondition.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
        ),
      );
    }

    // If role query exists, filter by role
    if (role) {
      filterCondition.push(eq(user.role, role as "student" | "teacher" | "admin"));
    }

    // Combine all filters if any exists
    const whereClause =
      filterCondition.length > 0 ? and(...filterCondition) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const userList = await db
      .select({
        ...getTableColumns(user),
      })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: userList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (err) {
    console.error(`GET /users error: ${err}`);
    res.status(500).json({ error: "Failed to get users" });
  }
});

export default usersRouter;
