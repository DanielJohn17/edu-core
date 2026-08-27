import { Request, Response } from "express";
import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/db";
import { classes, enrollments, subjects, user } from "../db/schema";
import { AppError, getPagination, paginatedResponse } from "../utils/api";

const teacherUser = alias(user, "teacher_user");

export const getEnrollments = async (req: Request, res: Response) => {
  const { search, studentId, classId } = req.query as {
    search?: string;
    studentId?: string;
    classId?: number;
  };
  const { page, limit, offset } = getPagination(req.query);

  const filterConditions = [];

  if (studentId) {
    filterConditions.push(eq(enrollments.studentId, studentId));
  }

  if (classId) {
    filterConditions.push(eq(enrollments.classId, Number(classId)));
  }

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    filterConditions.push(
      or(
        ilike(user.name, pattern),
        ilike(user.email, pattern),
        ilike(classes.name, pattern),
        ilike(subjects.name, pattern),
        ilike(subjects.code, pattern),
      ),
    );
  }

  const whereClause =
    filterConditions.length > 0 ? and(...filterConditions) : undefined;

  const [countResult] = await db
    .select({ count: count() })
    .from(enrollments)
    .leftJoin(user, eq(enrollments.studentId, user.id))
    .leftJoin(classes, eq(enrollments.classId, classes.id))
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .where(whereClause);

  const totalCount = countResult?.count ?? 0;

  const enrollmentList = await db
    .select({
      ...getTableColumns(enrollments),
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
      class: {
        id: classes.id,
        name: classes.name,
        capacity: classes.capacity,
        status: classes.status,
        inviteCode: classes.inviteCode,
        bannerUrl: classes.bannerUrl,
        schedules: classes.schedules,
      },
      subject: {
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
      },
      teacher: {
        id: teacherUser.id,
        name: teacherUser.name,
        email: teacherUser.email,
        image: teacherUser.image,
      },
    })
    .from(enrollments)
    .leftJoin(user, eq(enrollments.studentId, user.id))
    .leftJoin(classes, eq(enrollments.classId, classes.id))
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .leftJoin(teacherUser, eq(classes.teacherId, teacherUser.id))
    .where(whereClause)
    .orderBy(desc(enrollments.createdAt))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(res, enrollmentList, totalCount, page, limit);
};

export const getEnrollmentStats = async (_req: Request, res: Response) => {
  const [totalEnrollmentsResult, distinctStudentsResult] = await Promise.all([
    db.select({ count: count() }).from(enrollments),
    db.select({ count: count(enrollments.studentId) }).from(enrollments),
  ]);

  return res.status(200).json({
    data: {
      totalEnrollments: totalEnrollmentsResult[0]?.count ?? 0,
      totalEnrolledStudents: distinctStudentsResult[0]?.count ?? 0,
    },
  });
};

export const getEnrollmentById = async (req: Request, res: Response) => {
  const enrollmentId = Number(req.params.id);

  const [enrollmentRecord] = await db
    .select({
      ...getTableColumns(enrollments),
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
      class: {
        id: classes.id,
        name: classes.name,
        capacity: classes.capacity,
        status: classes.status,
        inviteCode: classes.inviteCode,
        bannerUrl: classes.bannerUrl,
        schedules: classes.schedules,
      },
      subject: {
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
      },
      teacher: {
        id: teacherUser.id,
        name: teacherUser.name,
        email: teacherUser.email,
        image: teacherUser.image,
      },
    })
    .from(enrollments)
    .leftJoin(user, eq(enrollments.studentId, user.id))
    .leftJoin(classes, eq(enrollments.classId, classes.id))
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .leftJoin(teacherUser, eq(classes.teacherId, teacherUser.id))
    .where(eq(enrollments.id, enrollmentId));

  if (!enrollmentRecord) {
    throw new AppError("Enrollment not found", 404);
  }

  return res.status(200).json({ data: enrollmentRecord });
};

export const createEnrollment = async (req: Request, res: Response) => {
  const { studentId, classId } = req.body;

  const [existingStudent] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.id, studentId));

  if (!existingStudent) {
    throw new AppError("Student not found", 404);
  }

  const [targetClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, classId));

  if (!targetClass) {
    throw new AppError("Class not found", 404);
  }

  if (targetClass.status !== "active") {
    throw new AppError(`Cannot enroll in a ${targetClass.status} class`, 400);
  }

  const [existingEnrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.classId, classId),
      ),
    );

  if (existingEnrollment) {
    throw new AppError("Student is already enrolled in this class", 409);
  }

  const [currentCountResult] = await db
    .select({ count: count() })
    .from(enrollments)
    .where(eq(enrollments.classId, classId));

  const currentCount = currentCountResult?.count ?? 0;
  if (currentCount >= targetClass.capacity) {
    throw new AppError(
      `Class has reached its maximum capacity (${targetClass.capacity})`,
      400,
    );
  }

  const [created] = await db
    .insert(enrollments)
    .values({
      studentId,
      classId,
    })
    .returning();

  if (!created) {
    throw new AppError("Failed to insert enrollment", 500);
  }

  return res.status(201).json({
    data: created,
    message: "Student successfully enrolled in class",
  });
};

export const joinByInviteCode = async (req: Request, res: Response) => {
  const { studentId, inviteCode } = req.body;

  const [existingStudent] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.id, studentId));

  if (!existingStudent) {
    throw new AppError("Student not found", 404);
  }

  const [targetClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.inviteCode, inviteCode));

  if (!targetClass) {
    throw new AppError("Invalid class invite code", 404);
  }

  if (targetClass.status !== "active") {
    throw new AppError(`Cannot join a ${targetClass.status} class`, 400);
  }

  const [existingEnrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.classId, targetClass.id),
      ),
    );

  if (existingEnrollment) {
    throw new AppError("Student is already enrolled in this class", 409);
  }

  const [currentCountResult] = await db
    .select({ count: count() })
    .from(enrollments)
    .where(eq(enrollments.classId, targetClass.id));

  const currentCount = currentCountResult?.count ?? 0;
  if (currentCount >= targetClass.capacity) {
    throw new AppError(
      `Class has reached its maximum capacity (${targetClass.capacity})`,
      400,
    );
  }

  const [created] = await db
    .insert(enrollments)
    .values({
      studentId,
      classId: targetClass.id,
    })
    .returning();

  return res.status(201).json({
    data: created,
    message: `Successfully joined ${targetClass.name}`,
  });
};

export const deleteEnrollment = async (req: Request, res: Response) => {
  const enrollmentId = Number(req.params.id);

  const [deleted] = await db
    .delete(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .returning();

  if (!deleted) {
    throw new AppError("Enrollment not found", 404);
  }

  return res.status(200).json({
    data: deleted,
    message: "Successfully unenrolled from class",
  });
};
