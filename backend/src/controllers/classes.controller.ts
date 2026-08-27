import { Request, Response } from "express";
import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { db } from "../db/db";
import { classes, departments, subjects, user } from "../db/schema";
import { AppError, getPagination, paginatedResponse } from "../utils/api";

export const getClasses = async (req: Request, res: Response) => {
  const { search, subject, subjectId, teacherId, status } = req.query as {
    search?: string;
    subject?: string;
    subjectId?: number;
    teacherId?: string;
    status?: "active" | "inactive" | "archived";
  };
  const { page, limit, offset } = getPagination(req.query);

  const filterCondition = [];

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    filterCondition.push(
      or(ilike(classes.name, pattern), ilike(classes.inviteCode, pattern)),
    );
  }

  if (subject) {
    filterCondition.push(
      ilike(subjects.name, `%${String(subject).replace(/([%_\\])/g, "\\$&")}%`),
    );
  }

  if (subjectId) {
    filterCondition.push(eq(classes.subjectId, Number(subjectId)));
  }

  if (teacherId) {
    filterCondition.push(eq(classes.teacherId, teacherId));
  }

  if (status) {
    filterCondition.push(eq(classes.status, status));
  }

  const whereClause =
    filterCondition.length > 0 ? and(...filterCondition) : undefined;

  const countResult = await db
    .select({ count: count() })
    .from(classes)
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .leftJoin(user, eq(classes.teacherId, user.id))
    .where(whereClause);

  const totalCount = countResult[0]?.count ?? 0;
  const { inviteCode: _inviteCode, ...classColumns } = getTableColumns(classes);

  const classList = await db
    .select({
      ...classColumns,
      subject: {
        ...getTableColumns(subjects),
      },
      teacher: {
        ...getTableColumns(user),
      },
    })
    .from(classes)
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .leftJoin(user, eq(classes.teacherId, user.id))
    .where(whereClause)
    .orderBy(desc(classes.createdAt))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(res, classList, totalCount, page, limit);
};

export const getClassById = async (req: Request, res: Response) => {
  const classId = Number(req.params.id);
  const { inviteCode: _inviteCode, ...classColumns } = getTableColumns(classes);

  const [classDetails] = await db
    .select({
      ...classColumns,
      subject: {
        ...getTableColumns(subjects),
      },
      department: {
        ...getTableColumns(departments),
      },
      teacher: {
        ...getTableColumns(user),
      },
    })
    .from(classes)
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .leftJoin(departments, eq(subjects.departmentId, departments.id))
    .leftJoin(user, eq(classes.teacherId, user.id))
    .where(eq(classes.id, classId));

  if (!classDetails) {
    throw new AppError("Class not found", 404);
  }

  return res.status(200).json({ data: classDetails });
};

export const createClass = async (req: Request, res: Response) => {
  const {
    subjectId,
    teacherId,
    name,
    description,
    capacity,
    status,
    bannerUrl,
    bannerCldPubId,
    schedules,
    inviteCode,
  } = req.body;

  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.id, subjectId));

  if (!subject) {
    throw new AppError("Subject not found", 404);
  }

  const [teacher] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, teacherId));

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  const generatedInviteCode =
    inviteCode?.trim() ||
    Math.random().toString(36).substring(2, 9).toUpperCase();

  const [createdClass] = await db
    .insert(classes)
    .values({
      subjectId,
      teacherId,
      name,
      description: description ?? null,
      capacity: capacity ?? 50,
      status: status ?? "active",
      bannerUrl: bannerUrl ?? null,
      bannerCldPubId: bannerCldPubId ?? null,
      schedules: schedules ?? [],
      inviteCode: generatedInviteCode,
    })
    .returning();

  if (!createdClass) {
    throw new AppError("Failed to create class", 500);
  }

  return res.status(201).json({ data: createdClass });
};

export const updateClass = async (req: Request, res: Response) => {
  const classId = Number(req.params.id);

  const [updated] = await db
    .update(classes)
    .set(req.body)
    .where(eq(classes.id, classId))
    .returning();

  if (!updated) {
    throw new AppError("Class not found", 404);
  }

  return res.status(200).json({ data: updated });
};

export const deleteClass = async (req: Request, res: Response) => {
  const classId = Number(req.params.id);

  const [deleted] = await db
    .delete(classes)
    .where(eq(classes.id, classId))
    .returning();

  if (!deleted) {
    throw new AppError("Class not found", 404);
  }

  return res.status(200).json({
    data: deleted,
    message: "Class deleted successfully",
  });
};
