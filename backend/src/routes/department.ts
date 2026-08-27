import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartmentClasses,
  getDepartments,
  getDepartmentSubjects,
  getDepartmentTeachers,
  updateDepartment,
} from "../controllers/department.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate";
import {
  createDepartmentSchema,
  departmentQuerySchema,
  departmentSubQuerySchema,
  numericIdParamSchema,
  updateDepartmentSchema,
} from "../validations";

const departmentsRouter = express.Router();

// GET /api/departments - list all departments with pagination and search
departmentsRouter.get("/", validateQuery(departmentQuerySchema), getDepartments);

// GET /api/departments/:id - get a single department with stats and relations
departmentsRouter.get("/:id", validateParams(numericIdParamSchema), getDepartmentById);

// POST /api/departments - create a department
departmentsRouter.post("/", validateBody(createDepartmentSchema), createDepartment);

// PATCH /api/departments/:id - update a department
departmentsRouter.patch(
  "/:id",
  validateParams(numericIdParamSchema),
  validateBody(updateDepartmentSchema),
  updateDepartment,
);

// DELETE /api/departments/:id - delete a department
departmentsRouter.delete("/:id", validateParams(numericIdParamSchema), deleteDepartment);

// GET /api/departments/:id/subjects - paginated subjects for a department
departmentsRouter.get(
  "/:id/subjects",
  validateParams(numericIdParamSchema),
  validateQuery(departmentSubQuerySchema),
  getDepartmentSubjects,
);

// GET /api/departments/:id/classes - paginated classes for a department
departmentsRouter.get(
  "/:id/classes",
  validateParams(numericIdParamSchema),
  validateQuery(departmentSubQuerySchema),
  getDepartmentClasses,
);

// GET /api/departments/:id/teachers - paginated teachers for a department
departmentsRouter.get(
  "/:id/teachers",
  validateParams(numericIdParamSchema),
  validateQuery(departmentSubQuerySchema),
  getDepartmentTeachers,
);

export default departmentsRouter;
