import { Request, Response } from "express";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/db";
import { user } from "../db/schema";
import { AppError, getPagination, paginatedResponse } from "../utils/api";

export const getUsers = async (req: Request, res: Response) => {
  const { search, role } = req.query as {
    search?: string;
    role?: "student" | "teacher" | "admin";
  };
  const { page, limit, offset } = getPagination(req.query);

  const filterCondition = [];

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    filterCondition.push(
      or(ilike(user.name, pattern), ilike(user.email, pattern)),
    );
  }

  if (role) {
    filterCondition.push(eq(user.role, role));
  }

  const whereClause =
    filterCondition.length > 0 ? and(...filterCondition) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .where(whereClause);

  const totalCount = Number(countResult[0]?.count ?? 0);

  const userList = await db
    .select({ ...getTableColumns(user) })
    .from(user)
    .where(whereClause)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(res, userList, totalCount, page, limit);
};

export const getUserById = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const [foundUser] = await db
    .select({ ...getTableColumns(user) })
    .from(user)
    .where(eq(user.id, id));

  if (!foundUser) {
    throw new AppError("User not found", 404);
  }

  return res.status(200).json({ data: foundUser });
};
