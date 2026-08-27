import { Request, Response } from "express";
import { and, count, desc, eq, getTableColumns, ilike, inArray, or, SQL } from "drizzle-orm";
import { db } from "../db/db";
import { classes, departments, enrollments, subjects, user } from "../db/schema";
import { AppError, getPagination, paginatedResponse } from "../utils/api";

export const getDepartments = async (req: Request, res: Response) => {
  const { search } = req.query as { search?: string };
  const { page, limit, offset } = getPagination(req.query);

  const filterConditions = [];
  if (search) {
    const pattern = `%${String(search).replace(/[%_]/g, "\\$&")}%`;
    filterConditions.push(
      or(ilike(departments.name, pattern), ilike(departments.code, pattern)),
    );
  }

  const whereClause =
    filterConditions.length > 0 ? and(...filterConditions) : undefined;

  const [countResult] = await db
    .select({ count: count() })
    .from(departments)
    .where(whereClause);

  const totalCount = countResult?.count ?? 0;

  const departmentList = await db
    .select({ ...getTableColumns(departments) })
    .from(departments)
    .where(whereClause)
    .orderBy(desc(departments.createdAt))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(res, departmentList, totalCount, page, limit);
};

export const getDepartmentById = async (req: Request, res: Response) => {
  const departmentId = Number(req.params.id);

  const [department] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, departmentId));

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  const { inviteCode: _inviteCode, ...classColumns } = getTableColumns(classes);

  const [departmentSubjects, departmentClasses, enrolledResult] =
    await Promise.all([
      db
        .select()
        .from(subjects)
        .where(eq(subjects.departmentId, departmentId))
        .orderBy(desc(subjects.createdAt)),
      db
        .select({
          ...classColumns,
          subject: {
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
          },
          teacher: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          },
        })
        .from(classes)
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .where(eq(subjects.departmentId, departmentId))
        .orderBy(desc(classes.createdAt)),
      db
        .select({ count: count() })
        .from(enrollments)
        .innerJoin(classes, eq(enrollments.classId, classes.id))
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .where(eq(subjects.departmentId, departmentId)),
    ]);

  const teacherMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      image: string | null;
      role: string;
    }
  >();

  for (const cls of departmentClasses) {
    if (cls.teacher && !teacherMap.has(cls.teacher.id)) {
      teacherMap.set(cls.teacher.id, cls.teacher);
    }
  }

  return res.status(200).json({
    data: {
      ...department,
      subjects: departmentSubjects,
      classes: departmentClasses,
      teachers: Array.from(teacherMap.values()),
      stats: {
        totalSubjects: departmentSubjects.length,
        totalClasses: departmentClasses.length,
        enrolledStudents: enrolledResult[0]?.count ?? 0,
      },
    },
  });
};

export const createDepartment = async (req: Request, res: Response) => {
  const { code, name, description } = req.body;

  const [created] = await db
    .insert(departments)
    .values({
      code,
      name,
      description: description ?? null,
    })
    .returning();

  if (!created) {
    throw new AppError("Failed to create department", 500);
  }

  return res.status(201).json({ data: created });
};

export const updateDepartment = async (req: Request, res: Response) => {
  const departmentId = Number(req.params.id);

  if (Object.keys(req.body).length === 0) {
    throw new AppError("No valid fields to update", 400);
  }

  const [updated] = await db
    .update(departments)
    .set(req.body)
    .where(eq(departments.id, departmentId))
    .returning();

  if (!updated) {
    throw new AppError("Department not found", 404);
  }

  return res.status(200).json({ data: updated });
};

export const deleteDepartment = async (req: Request, res: Response) => {
  const departmentId = Number(req.params.id);

  const [deleted] = await db
    .delete(departments)
    .where(eq(departments.id, departmentId))
    .returning({ id: departments.id });

  if (!deleted) {
    throw new AppError("Department not found", 404);
  }

  return res.status(200).json({
    data: deleted,
    message: "Department deleted successfully",
  });
};

export const getDepartmentSubjects = async (req: Request, res: Response) => {
  const departmentId = Number(req.params.id);
  const { search } = req.query as { search?: string };
  const { page, limit, offset } = getPagination(req.query);

  const filterConditions: (SQL | undefined)[] = [
    eq(subjects.departmentId, departmentId),
  ];

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    filterConditions.push(
      or(ilike(subjects.name, pattern), ilike(subjects.code, pattern)),
    );
  }

  const whereClause = and(
    ...filterConditions.filter((c): c is SQL => Boolean(c)),
  );

  const [countResult] = await db
    .select({ count: count() })
    .from(subjects)
    .where(whereClause);

  const totalCount = countResult?.count ?? 0;

  const rows = await db
    .select()
    .from(subjects)
    .where(whereClause)
    .orderBy(desc(subjects.createdAt))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(res, rows, totalCount, page, limit);
};

export const getDepartmentClasses = async (req: Request, res: Response) => {
  const departmentId = Number(req.params.id);
  const { search, status, teacherId } = req.query as {
    search?: string;
    status?: "active" | "inactive" | "archived";
    teacherId?: string;
  };
  const { page, limit, offset } = getPagination(req.query);

  const filterConditions: (SQL | undefined)[] = [
    eq(subjects.departmentId, departmentId),
  ];

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    filterConditions.push(
      or(
        ilike(classes.name, pattern),
        ilike(classes.inviteCode, pattern),
        ilike(subjects.name, pattern),
      ),
    );
  }

  if (status) {
    filterConditions.push(eq(classes.status, status));
  }

  if (teacherId) {
    filterConditions.push(eq(classes.teacherId, teacherId));
  }

  const whereClause = and(
    ...filterConditions.filter((c): c is SQL => Boolean(c)),
  );

  const [countResult] = await db
    .select({ count: count() })
    .from(classes)
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .where(whereClause);

  const totalCount = countResult?.count ?? 0;
  const { inviteCode: _inviteCode, ...classColumns } = getTableColumns(classes);

  const rows = await db
    .select({
      ...classColumns,
      subject: {
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
      },
      teacher: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(classes)
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .leftJoin(user, eq(classes.teacherId, user.id))
    .where(whereClause)
    .orderBy(desc(classes.createdAt))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(res, rows, totalCount, page, limit);
};

export const getDepartmentTeachers = async (req: Request, res: Response) => {
  const departmentId = Number(req.params.id);
  const { search, role } = req.query as {
    search?: string;
    role?: "student" | "teacher" | "admin";
  };
  const { page, limit, offset } = getPagination(req.query);

  const subjectIds = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.departmentId, departmentId));

  if (subjectIds.length === 0) {
    return paginatedResponse(res, [], 0, page, limit);
  }

  const sIds = subjectIds.map((s) => s.id);

  const classTeachers = await db
    .select({ teacherId: classes.teacherId })
    .from(classes)
    .where(inArray(classes.subjectId, sIds));

  const teacherIds = [
    ...new Set(classTeachers.map((c) => c.teacherId).filter(Boolean)),
  ];

  if (teacherIds.length === 0) {
    return paginatedResponse(res, [], 0, page, limit);
  }

  const filterConditions: (SQL | undefined)[] = [inArray(user.id, teacherIds)];

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    filterConditions.push(
      or(ilike(user.name, pattern), ilike(user.email, pattern)),
    );
  }

  if (role) {
    filterConditions.push(eq(user.role, role));
  }

  const whereClause = and(
    ...filterConditions.filter((c): c is SQL => Boolean(c)),
  );

  const [countResult] = await db
    .select({ count: count() })
    .from(user)
    .where(whereClause);

  const totalCount = countResult?.count ?? 0;

  const teachersList = await db
    .select({ ...getTableColumns(user) })
    .from(user)
    .where(whereClause)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(res, teachersList, totalCount, page, limit);
};
