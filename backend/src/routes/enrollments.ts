import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import express from "express";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/db";
import { classes, enrollments, subjects, user } from "../db/schema";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate";
import {
  createEnrollmentSchema,
  enrollByInviteCodeSchema,
  enrollmentQuerySchema,
  numericIdParamSchema,
} from "../validations";

const enrollmentsRouter = express.Router();

// Teacher user alias to distinguish teacher from student join
const teacherUser = alias(user, "teacher_user");

// GET /api/enrollments - List enrollments with filtering, search, and pagination
enrollmentsRouter.get(
  "/",
  validateQuery(enrollmentQuerySchema),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        studentId,
        classId,
      } = req.query as unknown as {
        page: number;
        limit: number;
        search?: string;
        studentId?: string;
        classId?: number;
      };

      const currentPage = Math.max(1, Number(page) || 1);
      const limitPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
      const offset = (currentPage - 1) * limitPerPage;

      const filterConditions = [];

      if (studentId) {
        filterConditions.push(eq(enrollments.studentId, studentId));
      }

      if (classId) {
        filterConditions.push(eq(enrollments.classId, classId));
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
        .limit(limitPerPage)
        .offset(offset);

      return res.status(200).json({
        data: enrollmentList,
        pagination: {
          page: currentPage,
          limit: limitPerPage,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitPerPage),
        },
      });
    } catch (err) {
      console.error(`GET /enrollments error: ${err}`);
      return res.status(500).json({
        message: "Failed to get enrollments",
        error: "Failed to get enrollments",
      });
    }
  },
);

// GET /api/enrollments/stats - Enrollment overview metrics
enrollmentsRouter.get("/stats", async (_req, res) => {
  try {
    const [totalEnrollmentsResult, distinctStudentsResult] = await Promise.all([
      db.select({ count: count() }).from(enrollments),
      db
        .select({ count: count(enrollments.studentId) })
        .from(enrollments),
    ]);

    return res.status(200).json({
      data: {
        totalEnrollments: totalEnrollmentsResult[0]?.count ?? 0,
        totalEnrolledStudents: distinctStudentsResult[0]?.count ?? 0,
      },
    });
  } catch (err) {
    console.error(`GET /enrollments/stats error: ${err}`);
    return res.status(500).json({
      message: "Failed to fetch enrollment statistics",
      error: "Failed to fetch enrollment statistics",
    });
  }
});

// GET /api/enrollments/:id - Get a single enrollment by ID
enrollmentsRouter.get(
  "/:id",
  validateParams(numericIdParamSchema),
  async (req, res) => {
    try {
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
        return res.status(404).json({
          message: "Enrollment not found",
          error: "Enrollment not found",
        });
      }

      return res.status(200).json({ data: enrollmentRecord });
    } catch (err) {
      console.error(`GET /enrollments/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to get enrollment",
        error: "Failed to get enrollment",
      });
    }
  },
);

// POST /api/enrollments - Enroll student in a class
enrollmentsRouter.post(
  "/",
  validateBody(createEnrollmentSchema),
  async (req, res) => {
    try {
      const { studentId, classId } = req.body;

      // 1. Verify student exists
      const [existingStudent] = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(eq(user.id, studentId));

      if (!existingStudent) {
        return res.status(404).json({
          message: "Student not found",
          error: "Student not found",
        });
      }

      // 2. Verify class exists and is active
      const [targetClass] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, classId));

      if (!targetClass) {
        return res.status(404).json({
          message: "Class not found",
          error: "Class not found",
        });
      }

      if (targetClass.status !== "active") {
        return res.status(400).json({
          message: `Cannot enroll in a ${targetClass.status} class`,
          error: `Cannot enroll in a ${targetClass.status} class`,
        });
      }

      // 3. Check if already enrolled
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
        return res.status(409).json({
          message: "Student is already enrolled in this class",
          error: "Student is already enrolled in this class",
        });
      }

      // 4. Check class capacity
      const [currentCountResult] = await db
        .select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.classId, classId));

      const currentCount = currentCountResult?.count ?? 0;
      if (currentCount >= targetClass.capacity) {
        return res.status(400).json({
          message: `Class has reached its maximum capacity (${targetClass.capacity})`,
          error: `Class has reached its maximum capacity (${targetClass.capacity})`,
        });
      }

      // 5. Insert enrollment
      const [created] = await db
        .insert(enrollments)
        .values({
          studentId,
          classId,
        })
        .returning();

      if (!created) {
        throw new Error("Failed to insert enrollment");
      }

      return res.status(201).json({
        data: created,
        message: "Student successfully enrolled in class",
      });
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({
          message: "Student is already enrolled in this class",
          error: "Student is already enrolled in this class",
        });
      }
      console.error(`POST /enrollments error: ${err}`);
      return res.status(500).json({
        message: "Failed to create enrollment",
        error: "Failed to create enrollment",
      });
    }
  },
);

// POST /api/enrollments/join - Join class via invite code
enrollmentsRouter.post(
  "/join",
  validateBody(enrollByInviteCodeSchema),
  async (req, res) => {
    try {
      const { studentId, inviteCode } = req.body;

      // 1. Verify student exists
      const [existingStudent] = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(eq(user.id, studentId));

      if (!existingStudent) {
        return res.status(404).json({
          message: "Student not found",
          error: "Student not found",
        });
      }

      // 2. Find class by invite code
      const [targetClass] = await db
        .select()
        .from(classes)
        .where(eq(classes.inviteCode, inviteCode));

      if (!targetClass) {
        return res.status(404).json({
          message: "Invalid class invite code",
          error: "Invalid class invite code",
        });
      }

      if (targetClass.status !== "active") {
        return res.status(400).json({
          message: `Cannot join a ${targetClass.status} class`,
          error: `Cannot join a ${targetClass.status} class`,
        });
      }

      // 3. Check if already enrolled
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
        return res.status(409).json({
          message: "Student is already enrolled in this class",
          error: "Student is already enrolled in this class",
        });
      }

      // 4. Check class capacity
      const [currentCountResult] = await db
        .select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.classId, targetClass.id));

      const currentCount = currentCountResult?.count ?? 0;
      if (currentCount >= targetClass.capacity) {
        return res.status(400).json({
          message: `Class has reached its maximum capacity (${targetClass.capacity})`,
          error: `Class has reached its maximum capacity (${targetClass.capacity})`,
        });
      }

      // 5. Insert enrollment
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
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({
          message: "Student is already enrolled in this class",
          error: "Student is already enrolled in this class",
        });
      }
      console.error(`POST /enrollments/join error: ${err}`);
      return res.status(500).json({
        message: "Failed to join class",
        error: "Failed to join class",
      });
    }
  },
);

// DELETE /api/enrollments/:id - Unenroll / Remove enrollment record
enrollmentsRouter.delete(
  "/:id",
  validateParams(numericIdParamSchema),
  async (req, res) => {
    try {
      const enrollmentId = Number(req.params.id);

      const [deleted] = await db
        .delete(enrollments)
        .where(eq(enrollments.id, enrollmentId))
        .returning();

      if (!deleted) {
        return res.status(404).json({
          message: "Enrollment not found",
          error: "Enrollment not found",
        });
      }

      return res.status(200).json({
        data: deleted,
        message: "Successfully unenrolled from class",
      });
    } catch (err) {
      console.error(`DELETE /enrollments/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to remove enrollment",
        error: "Failed to remove enrollment",
      });
    }
  },
);

export default enrollmentsRouter;
