import express from "express";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
} from "../controllers/subject.controller";
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
subjectsRouter.get("/", validateQuery(subjectQuerySchema), getSubjects);

// GET /api/subjects/:id - Get a single subject by ID
subjectsRouter.get("/:id", validateParams(numericIdParamSchema), getSubjectById);

// POST /api/subjects - Create a new subject
subjectsRouter.post("/", validateBody(createSubjectSchema), createSubject);

// PATCH /api/subjects/:id - Update a subject
subjectsRouter.patch(
  "/:id",
  validateParams(numericIdParamSchema),
  validateBody(updateSubjectSchema),
  updateSubject,
);

// DELETE /api/subjects/:id - Delete a subject
subjectsRouter.delete("/:id", validateParams(numericIdParamSchema), deleteSubject);

export default subjectsRouter;
