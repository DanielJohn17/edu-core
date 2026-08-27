import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import express from "express";
import { departments, subjects } from "../db/schema";
import { db } from "../db/db";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate";
import {
  createSubjectSchema,
  numericIdParamSchema,
  subjectQuerySchema,
  updateSubjectSchema,
} from "../validations";

const subjectsRouter = express.Router();

// GET /api/subjects - Get all subjects with optional search, filtering and pagination
subjectsRouter.get(
  "/",
  validateQuery(subjectQuerySchema),
  async (req, res) => {
    try {
      const {
        search,
        department,
        departmentId,
        page = 1,
        limit = 10,
      } = req.query as unknown as {
        search?: string;
        department?: string;
        departmentId?: number;
        page: number;
        limit: number;
      };

      const currentPage = Math.max(1, Number(page) || 1);
      const limitPerPage = Math.min(100, Math.max(1, Number(limit) || 10));
      const offset = (currentPage - 1) * limitPerPage;

      const filterCondition = [];

      // If search query exists, filter by subject name or subject code
      if (search) {
        const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
        filterCondition.push(
          or(
            ilike(subjects.name, pattern),
            ilike(subjects.code, pattern),
          ),
        );
      }

      // If department query exists, filter by department name
      if (department) {
        const deptPattern = `%${String(department).replace(/[%_]/g, "\\$&")}%`;
        filterCondition.push(ilike(departments.name, deptPattern));
      }

      if (departmentId) {
        filterCondition.push(eq(subjects.departmentId, departmentId));
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
        .limit(limitPerPage)
        .offset(offset);

      return res.status(200).json({
        data: subjectList,
        pagination: {
          page: currentPage,
          limit: limitPerPage,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitPerPage),
        },
      });
    } catch (err) {
      console.error(`GET /subjects error: ${err}`);
      return res.status(500).json({
        message: "Failed to get subjects",
        error: "Failed to get subjects",
      });
    }
  },
);

// GET /api/subjects/:id - Get a single subject by ID
subjectsRouter.get(
  "/:id",
  validateParams(numericIdParamSchema),
  async (req, res) => {
    try {
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
        return res.status(404).json({
          message: "Subject not found",
          error: "Subject not found",
        });
      }

      return res.status(200).json({ data: subject });
    } catch (err) {
      console.error(`GET /subjects/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to get subject",
        error: "Failed to get subject",
      });
    }
  },
);

// POST /api/subjects - Create a new subject
subjectsRouter.post(
  "/",
  validateBody(createSubjectSchema),
  async (req, res) => {
    try {
      const { departmentId, code, name, description } = req.body;

      // Verify department exists
      const [dept] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(eq(departments.id, departmentId));

      if (!dept) {
        return res.status(404).json({
          message: "Department not found",
          error: "Department not found",
        });
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
        throw new Error("Insert returned no rows");
      }

      return res.status(201).json({ data: created });
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({
          message: "A subject with this code already exists",
          error: "A subject with this code already exists",
        });
      }
      console.error(`POST /subjects error: ${err}`);
      return res.status(500).json({
        message: "Failed to create subject",
        error: "Failed to create subject",
      });
    }
  },
);

// PATCH /api/subjects/:id - Update a subject
subjectsRouter.patch(
  "/:id",
  validateParams(numericIdParamSchema),
  validateBody(updateSubjectSchema),
  async (req, res) => {
    try {
      const subjectId = Number(req.params.id);

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          message: "No valid fields to update",
          error: "No valid fields to update",
        });
      }

      // If departmentId is being updated, verify department exists
      if (req.body.departmentId) {
        const [dept] = await db
          .select({ id: departments.id })
          .from(departments)
          .where(eq(departments.id, req.body.departmentId));

        if (!dept) {
          return res.status(404).json({
            message: "Department not found",
            error: "Department not found",
          });
        }
      }

      const [updated] = await db
        .update(subjects)
        .set(req.body)
        .where(eq(subjects.id, subjectId))
        .returning();

      if (!updated) {
        return res.status(404).json({
          message: "Subject not found",
          error: "Subject not found",
        });
      }

      return res.status(200).json({ data: updated });
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({
          message: "A subject with this code already exists",
          error: "A subject with this code already exists",
        });
      }
      console.error(`PATCH /subjects/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to update subject",
        error: "Failed to update subject",
      });
    }
  },
);

// DELETE /api/subjects/:id - Delete a subject
subjectsRouter.delete(
  "/:id",
  validateParams(numericIdParamSchema),
  async (req, res) => {
    try {
      const subjectId = Number(req.params.id);

      const [deleted] = await db
        .delete(subjects)
        .where(eq(subjects.id, subjectId))
        .returning({ id: subjects.id });

      if (!deleted) {
        return res.status(404).json({
          message: "Subject not found",
          error: "Subject not found",
        });
      }

      return res.status(200).json({
        data: deleted,
        message: "Subject deleted successfully",
      });
    } catch (err: any) {
      if (err?.code === "23503") {
        return res.status(409).json({
          message: "Cannot delete subject: it has active classes assigned to it",
          error: "Cannot delete subject: it has active classes assigned to it",
        });
      }
      console.error(`DELETE /subjects/:id error: ${err}`);
      return res.status(500).json({
        message: "Failed to delete subject",
        error: "Failed to delete subject",
      });
    }
  },
);

export default subjectsRouter;
