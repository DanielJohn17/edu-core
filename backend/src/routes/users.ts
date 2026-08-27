import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express from "express";
import { user } from "../db/schema";
import { db } from "../db/db";
import {
  validateParams,
  validateQuery,
} from "../middleware/validate";
import {
  stringIdParamSchema,
  userQuerySchema,
} from "../validations";

const usersRouter = express.Router();

// GET /api/users - Get all users with optional search, role filter, and pagination
usersRouter.get("/", validateQuery(userQuerySchema), async (req, res) => {
  try {
    const {
      search,
      role,
      page = 1,
      limit = 10,
    } = req.query as unknown as {
      search?: string;
      role?: "student" | "teacher" | "admin";
      page: number;
      limit: number;
    };

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (currentPage - 1) * limitPerPage;

    const filterCondition = [];

    // If search query exists, filter by user name or user email
    if (search) {
      const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
      filterCondition.push(
        or(
          ilike(user.name, pattern),
          ilike(user.email, pattern),
        ),
      );
    }

    // If role query exists, filter by role
    if (role) {
      filterCondition.push(eq(user.role, role));
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

    return res.status(200).json({
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
    return res.status(500).json({
      message: "Failed to get users",
      error: "Failed to get users",
    });
  }
});

// GET /api/users/:id - Get a single user by ID
usersRouter.get(
  "/:id",
  validateParams(stringIdParamSchema),
  async (req, res) => {
    try {
      const id = String(req.params.id);

      const [foundUser] = await db
        .select({
          ...getTableColumns(user),
        })
        .from(user)
        .where(eq(user.id, id));

      if (!foundUser) {
        return res.status(404).json({
          message: "User not found",
          error: "User not found",
        });
      }

      return res.status(200).json({ data: foundUser });
    } catch (err) {
      console.error(`GET /users/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to get user",
        error: "Failed to get user",
      });
    }
  },
);

export default usersRouter;
