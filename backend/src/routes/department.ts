import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  or,
} from "drizzle-orm";
import express from "express";
import { db } from "../db/db";
import { classes, departments, enrollments, subjects, user } from "../db/schema";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate";
import {
  createDepartmentSchema,
  departmentQuerySchema,
  numericIdParamSchema,
  paginationQuerySchema,
  updateDepartmentSchema,
} from "../validations";

const departmentsRouter = express.Router();

// GET /api/departments - list all departments with pagination and search
departmentsRouter.get(
  "/",
  validateQuery(departmentQuerySchema),
  async (req, res) => {
    try {
      const { search, page = 1, limit = 10 } = req.query as unknown as {
        search?: string;
        page: number;
        limit: number;
      };

      const currentPage = Math.max(1, Number(page) || 1);
      const limitPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
      const offset = (currentPage - 1) * limitPerPage;

      const filterConditions = [];

      if (search) {
        const pattern = `%${String(search).replace(/[%_]/g, "\\$&")}%`;
        filterConditions.push(
          or(
            ilike(departments.name, pattern),
            ilike(departments.code, pattern),
          ),
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
        .select({
          ...getTableColumns(departments),
        })
        .from(departments)
        .where(whereClause)
        .orderBy(desc(departments.createdAt))
        .limit(limitPerPage)
        .offset(offset);

      return res.status(200).json({
        data: departmentList,
        pagination: {
          page: currentPage,
          limit: limitPerPage,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitPerPage),
        },
      });
    } catch (err) {
      console.error(`GET /departments error: ${err}`);
      return res.status(500).json({
        message: "Failed to get departments",
        error: "Failed to get departments",
      });
    }
  },
);

// GET /api/departments/:id - get a single department with populated subjects, classes, teachers, and stats
departmentsRouter.get(
  "/:id",
  validateParams(numericIdParamSchema),
  async (req, res) => {
    try {
      const departmentId = Number(req.params.id);

      const [department] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, departmentId));

      if (!department) {
        return res.status(404).json({
          message: "Department not found",
          error: "Department not found",
        });
      }

      // Run parallel queries to fetch all related data with 0 N+1 issues
      const [departmentSubjects, departmentClasses, enrolledResult] =
        await Promise.all([
          db
            .select()
            .from(subjects)
            .where(eq(subjects.departmentId, departmentId))
            .orderBy(desc(subjects.createdAt)),
          db
            .select({
              ...getTableColumns(classes),
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

      // Extract unique teachers from the fetched classes
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

      const departmentTeachers = Array.from(teacherMap.values());

      return res.status(200).json({
        data: {
          ...department,
          subjects: departmentSubjects,
          classes: departmentClasses,
          teachers: departmentTeachers,
          stats: {
            totalSubjects: departmentSubjects.length,
            totalClasses: departmentClasses.length,
            enrolledStudents: enrolledResult[0]?.count ?? 0,
          },
        },
      });
    } catch (err) {
      console.error(`GET /departments/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to get department",
        error: "Failed to get department",
      });
    }
  },
);

// POST /api/departments - create a department
departmentsRouter.post(
  "/",
  validateBody(createDepartmentSchema),
  async (req, res) => {
    try {
      const { code, name, description } = req.body;

      const [created] = await db
        .insert(departments)
        .values({
          code,
          name,
          description: description ?? null,
        })
        .returning();

      if (!created) throw new Error("Insert returned no rows");

      return res.status(201).json({ data: created });
    } catch (err: any) {
      // Unique constraint violation (code already exists)
      if (err?.code === "23505") {
        return res
          .status(409)
          .json({
            message: "A department with that code already exists",
            error: "A department with that code already exists",
          });
      }
      console.error(`POST /departments error: ${err}`);
      return res.status(500).json({
        message: "Failed to create department",
        error: "Failed to create department",
      });
    }
  },
);

// PATCH /api/departments/:id - update a department
departmentsRouter.patch(
  "/:id",
  validateParams(numericIdParamSchema),
  validateBody(updateDepartmentSchema),
  async (req, res) => {
    try {
      const departmentId = Number(req.params.id);

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          message: "No valid fields to update",
          error: "No valid fields to update",
        });
      }

      const [updated] = await db
        .update(departments)
        .set(req.body)
        .where(eq(departments.id, departmentId))
        .returning();

      if (!updated) {
        return res.status(404).json({
          message: "Department not found",
          error: "Department not found",
        });
      }

      return res.status(200).json({ data: updated });
    } catch (err: any) {
      if (err?.code === "23505") {
        return res
          .status(409)
          .json({
            message: "A department with that code already exists",
            error: "A department with that code already exists",
          });
      }
      console.error(`PATCH /departments/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to update department",
        error: "Failed to update department",
      });
    }
  },
);

// DELETE /api/departments/:id - delete a department
departmentsRouter.delete(
  "/:id",
  validateParams(numericIdParamSchema),
  async (req, res) => {
    try {
      const departmentId = Number(req.params.id);

      const [deleted] = await db
        .delete(departments)
        .where(eq(departments.id, departmentId))
        .returning({ id: departments.id });

      if (!deleted) {
        return res.status(404).json({
          message: "Department not found",
          error: "Department not found",
        });
      }

      return res.status(200).json({
        data: deleted,
        message: "Department deleted successfully",
      });
    } catch (err: any) {
      // Foreign key violation - department has subjects
      if (err?.code === "23503") {
        return res.status(409).json({
          message: "Cannot delete department: it still has subjects assigned to it",
          error: "Cannot delete department: it still has subjects assigned to it",
        });
      }
      console.error(`DELETE /departments/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to delete department",
        error: "Failed to delete department",
      });
    }
  },
);

// GET /api/departments/:id/subjects - paginated subjects for a department
departmentsRouter.get(
  "/:id/subjects",
  validateParams(numericIdParamSchema),
  validateQuery(paginationQuerySchema),
  async (req, res) => {
    try {
      const departmentId = Number(req.params.id);
      const { page = 1, limit = 10 } = req.query as unknown as {
        page: number;
        limit: number;
      };
      const currentPage = Math.max(1, Number(page) || 1);
      const limitPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
      const offset = (currentPage - 1) * limitPerPage;

      const [countResult] = await db
        .select({ count: count() })
        .from(subjects)
        .where(eq(subjects.departmentId, departmentId));

      const totalCount = countResult?.count ?? 0;

      const rows = await db
        .select()
        .from(subjects)
        .where(eq(subjects.departmentId, departmentId))
        .orderBy(desc(subjects.createdAt))
        .limit(limitPerPage)
        .offset(offset);

      return res.status(200).json({
        data: rows,
        pagination: {
          page: currentPage,
          limit: limitPerPage,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitPerPage),
        },
      });
    } catch (err) {
      console.error(`GET /departments/:id/subjects error: ${err}`);
      return res.status(500).json({
        message: "Failed to get department subjects",
        error: "Failed to get department subjects",
      });
    }
  },
);

// GET /api/departments/:id/classes - paginated classes for a department
departmentsRouter.get(
  "/:id/classes",
  validateParams(numericIdParamSchema),
  validateQuery(paginationQuerySchema),
  async (req, res) => {
    try {
      const departmentId = Number(req.params.id);
      const { page = 1, limit = 10 } = req.query as unknown as {
        page: number;
        limit: number;
      };
      const currentPage = Math.max(1, Number(page) || 1);
      const limitPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
      const offset = (currentPage - 1) * limitPerPage;

      const [countResult] = await db
        .select({ count: count() })
        .from(classes)
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .where(eq(subjects.departmentId, departmentId));

      const totalCount = countResult?.count ?? 0;

      const rows = await db
        .select({
          ...getTableColumns(classes),
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
        .where(eq(subjects.departmentId, departmentId))
        .orderBy(desc(classes.createdAt))
        .limit(limitPerPage)
        .offset(offset);

      return res.status(200).json({
        data: rows,
        pagination: {
          page: currentPage,
          limit: limitPerPage,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitPerPage),
        },
      });
    } catch (err) {
      console.error(`GET /departments/:id/classes error: ${err}`);
      return res.status(500).json({
        message: "Failed to get department classes",
        error: "Failed to get department classes",
      });
    }
  },
);

// GET /api/departments/:id/teachers - paginated distinct teachers for a department
departmentsRouter.get(
  "/:id/teachers",
  validateParams(numericIdParamSchema),
  validateQuery(paginationQuerySchema),
  async (req, res) => {
    try {
      const departmentId = Number(req.params.id);
      const { page = 1, limit = 10 } = req.query as unknown as {
        page: number;
        limit: number;
      };
      const currentPage = Math.max(1, Number(page) || 1);
      const limitPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
      const offset = (currentPage - 1) * limitPerPage;

      // Find subjects belonging to this department
      const subjectIds = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.departmentId, departmentId));

      if (subjectIds.length === 0) {
        return res.status(200).json({
          data: [],
          pagination: {
            page: currentPage,
            limit: limitPerPage,
            total: 0,
            totalPages: 0,
          },
        });
      }

      const sIds = subjectIds.map((s) => s.id);

      // Find teachers of classes in these subjects
      const classTeachers = await db
        .select({ teacherId: classes.teacherId })
        .from(classes)
        .where(inArray(classes.subjectId, sIds));

      const teacherIds = [
        ...new Set(classTeachers.map((c) => c.teacherId).filter(Boolean)),
      ];

      if (teacherIds.length === 0) {
        return res.status(200).json({
          data: [],
          pagination: {
            page: currentPage,
            limit: limitPerPage,
            total: 0,
            totalPages: 0,
          },
        });
      }

      const totalCount = teacherIds.length;

      const teachersList = await db
        .select({
          ...getTableColumns(user),
        })
        .from(user)
        .where(inArray(user.id, teacherIds))
        .orderBy(desc(user.createdAt))
        .limit(limitPerPage)
        .offset(offset);

      return res.status(200).json({
        data: teachersList,
        pagination: {
          page: currentPage,
          limit: limitPerPage,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitPerPage),
        },
      });
    } catch (err) {
      console.error(`GET /departments/:id/teachers error: ${err}`);
      return res.status(500).json({
        message: "Failed to get department teachers",
        error: "Failed to get department teachers",
      });
    }
  },
);

export default departmentsRouter;
