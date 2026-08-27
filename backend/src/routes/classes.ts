import express from "express";
import {
  createClass,
  deleteClass,
  getClassById,
  getClasses,
  updateClass,
} from "../controllers/classes.controller";
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
classesRouter.get("/", validateQuery(classQuerySchema), getClasses);

// GET /api/classes/:id - Get specific class details
classesRouter.get("/:id", validateParams(numericIdParamSchema), getClassById);

// POST /api/classes - Create a class
classesRouter.post("/", validateBody(createClassSchema), createClass);

// PATCH /api/classes/:id - Update class
classesRouter.patch(
  "/:id",
  validateParams(numericIdParamSchema),
  validateBody(updateClassSchema),
  updateClass,
);

// DELETE /api/classes/:id - Delete class
classesRouter.delete("/:id", validateParams(numericIdParamSchema), deleteClass);

export default classesRouter;
