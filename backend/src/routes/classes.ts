import express from "express";
import { db } from "../db/db";
import { classes, departments, subjects, user } from "../db/schema";
import { and, ilike, or, eq, desc, getTableColumns, count } from "drizzle-orm";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate";
import {
  classQuerySchema,
  createClassSchema,
  numericIdParamSchema,
  updateClassSchema,
} from "../validations";

const classesRouter = express.Router();

// GET /api/classes - List classes with filtering and pagination
classesRouter.get("/", validateQuery(classQuerySchema), async (req, res) => {
  try {
    const {
      search,
      subject,
      subjectId,
      teacherId,
      status,
      page = 1,
      limit = 10,
    } = req.query as unknown as {
      search?: string;
      subject?: string;
      subjectId?: number;
      teacherId?: string;
      status?: "active" | "inactive" | "archived";
      page: number;
      limit: number;
    };

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (currentPage - 1) * limitPerPage;

    const filterCondition = [];

    if (search) {
      const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
      filterCondition.push(
        or(
          ilike(classes.name, pattern),
          ilike(classes.inviteCode, pattern),
        ),
      );
    }

    if (subject) {
      filterCondition.push(
        ilike(subjects.name, `%${String(subject).replace(/([%_\\])/g, "\\$&")}%`),
      );
    }

    if (subjectId) {
      filterCondition.push(eq(classes.subjectId, subjectId));
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

    const classList = await db
      .select({
        ...getTableColumns(classes),
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
  } catch (err) {
    console.error(`GET /classes error: ${err}`);
    return res.status(500).json({
      message: "Failed to get classes",
      error: "Failed to get classes",
    });
  }
});

// GET /api/classes/:id - Get specific class details
classesRouter.get(
  "/:id",
  validateParams(numericIdParamSchema),
  async (req, res) => {
    try {
      const classId = Number(req.params.id);

      const [classDetails] = await db
        .select({
          ...getTableColumns(classes),
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
        return res.status(404).json({
          message: "Class not found",
          error: "Class not found",
        });
      }

      return res.status(200).json({ data: classDetails });
    } catch (err) {
      console.error(`GET /classes/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to get class",
        error: "Failed to get class",
      });
    }
  },
);

// POST /api/classes - Create a class
classesRouter.post(
  "/",
  validateBody(createClassSchema),
  async (req, res) => {
    try {
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

      // Verify subject exists
      const [subject] = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.id, subjectId));

      if (!subject) {
        return res.status(404).json({
          message: "Subject not found",
          error: "Subject not found",
        });
      }

      // Verify teacher exists
      const [teacher] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, teacherId));

      if (!teacher) {
        return res.status(404).json({
          message: "Teacher not found",
          error: "Teacher not found",
        });
      }

      const generatedInviteCode =
        inviteCode?.trim() || Math.random().toString(36).substring(2, 9).toUpperCase();

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
        throw new Error("Failed to create class");
      }

      return res.status(201).json({ data: createdClass });
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({
          message: "A class with this invite code already exists",
          error: "A class with this invite code already exists",
        });
      }
      console.error(`POST /classes error: ${err}`);
      return res.status(500).json({
        message: "Failed to create class",
        error: "Failed to create class",
      });
    }
  },
);

// PATCH /api/classes/:id - Update class
classesRouter.patch(
  "/:id",
  validateParams(numericIdParamSchema),
  validateBody(updateClassSchema),
  async (req, res) => {
    try {
      const classId = Number(req.params.id);

      const [updated] = await db
        .update(classes)
        .set(req.body)
        .where(eq(classes.id, classId))
        .returning();

      if (!updated) {
        return res.status(404).json({
          message: "Class not found",
          error: "Class not found",
        });
      }

      return res.status(200).json({ data: updated });
    } catch (err) {
      console.error(`PATCH /classes/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to update class",
        error: "Failed to update class",
      });
    }
  },
);

// DELETE /api/classes/:id - Delete class
classesRouter.delete(
  "/:id",
  validateParams(numericIdParamSchema),
  async (req, res) => {
    try {
      const classId = Number(req.params.id);

      const [deleted] = await db
        .delete(classes)
        .where(eq(classes.id, classId))
        .returning();

      if (!deleted) {
        return res.status(404).json({
          message: "Class not found",
          error: "Class not found",
        });
      }

      return res.status(200).json({
        data: deleted,
        message: "Class deleted successfully",
      });
    } catch (err: any) {
      if (err?.code === "23503") {
        return res.status(409).json({
          message: "Cannot delete class: it has active enrollments",
          error: "Cannot delete class: it has active enrollments",
        });
      }
      console.error(`DELETE /classes/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to delete class",
        error: "Failed to delete class",
      });
    }
  },
);

export default classesRouter;
