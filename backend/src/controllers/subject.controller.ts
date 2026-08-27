import { Request, Response } from "express";
import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { db } from "../db/db";
import { departments, subjects } from "../db/schema";
import { AppError, getPagination, paginatedResponse } from "../utils/api";

export const getSubjects = async (req: Request, res: Response) => {
  const { search, department, departmentId } = req.query as {
    search?: string;
    department?: string;
    departmentId?: number;
  };
  const { page, limit, offset } = getPagination(req.query);

  const filterCondition = [];

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    filterCondition.push(
      or(ilike(subjects.name, pattern), ilike(subjects.code, pattern)),
    );
  }

  if (department) {
    const deptPattern = `%${String(department).replace(/[%_]/g, "\\$&")}%`;
    filterCondition.push(ilike(departments.name, deptPattern));
  }

  if (departmentId) {
    filterCondition.push(eq(subjects.departmentId, Number(departmentId)));
  }

  const whereClause =
    filterCondition.length > 0 ? and(...filterCondition) : undefined;

  const [countResult] = await db
    .select({ count: count() })
    .from(subjects)
    .leftJoin(departments, eq(subjects.departmentId, departments.id))
    .where(whereClause);

  const totalCount = countResult?.count ?? 0;

  const subjectList = await db
    .select({
      ...getTableColumns(subjects),
      department: {
        ...getTableColumns(departments),
      },
    })
    .from(subjects)
    .leftJoin(departments, eq(subjects.departmentId, departments.id))
    .where(whereClause)
    .orderBy(desc(subjects.createdAt))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(res, subjectList, totalCount, page, limit);
};

export const getSubjectById = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.id);

  const [subject] = await db
    .select({
      ...getTableColumns(subjects),
      department: {
        ...getTableColumns(departments),
      },
    })
    .from(subjects)
    .leftJoin(departments, eq(subjects.departmentId, departments.id))
    .where(eq(subjects.id, subjectId));

  if (!subject) {
    throw new AppError("Subject not found", 404);
  }

  return res.status(200).json({ data: subject });
};

export const createSubject = async (req: Request, res: Response) => {
  const { departmentId, code, name, description } = req.body;

  const [dept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.id, departmentId));

  if (!dept) {
    throw new AppError("Department not found", 404);
  }

  const [created] = await db
    .insert(subjects)
    .values({
      departmentId,
      code,
      name,
      description: description ?? null,
    })
    .returning();

  if (!created) {
    throw new AppError("Failed to create subject", 500);
  }

  return res.status(201).json({ data: created });
};

export const updateSubject = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.id);

  if (Object.keys(req.body).length === 0) {
    throw new AppError("No valid fields to update", 400);
  }

  if (req.body.departmentId) {
    const [dept] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, req.body.departmentId));

    if (!dept) {
      throw new AppError("Department not found", 404);
    }
  }

  const [updated] = await db
    .update(subjects)
    .set(req.body)
    .where(eq(subjects.id, subjectId))
    .returning();

  if (!updated) {
    throw new AppError("Subject not found", 404);
  }

  return res.status(200).json({ data: updated });
};

export const deleteSubject = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.id);

  const [deleted] = await db
    .delete(subjects)
    .where(eq(subjects.id, subjectId))
    .returning({ id: subjects.id });

  if (!deleted) {
    throw new AppError("Subject not found", 404);
  }

  return res.status(200).json({
    data: deleted,
    message: "Subject deleted successfully",
  });
};
