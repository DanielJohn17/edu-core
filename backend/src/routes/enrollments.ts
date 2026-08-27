import express from "express";
import {
  createEnrollment,
  deleteEnrollment,
  getEnrollmentById,
  getEnrollments,
  getEnrollmentStats,
  joinByInviteCode,
} from "../controllers/enrollments.controller";
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

// GET /api/enrollments - List enrollments with filtering, search, and pagination
enrollmentsRouter.get(
  "/",
  validateQuery(enrollmentQuerySchema),
  getEnrollments,
);

// GET /api/enrollments/stats - Enrollment overview metrics
enrollmentsRouter.get("/stats", getEnrollmentStats);

// GET /api/enrollments/:id - Get a single enrollment by ID
enrollmentsRouter.get(
  "/:id",
  validateParams(numericIdParamSchema),
  getEnrollmentById,
);

// POST /api/enrollments - Enroll student in a class
enrollmentsRouter.post(
  "/",
  validateBody(createEnrollmentSchema),
  createEnrollment,
);

// POST /api/enrollments/join - Join class via invite code
enrollmentsRouter.post(
  "/join",
  validateBody(enrollByInviteCodeSchema),
  joinByInviteCode,
);

// DELETE /api/enrollments/:id - Unenroll / Remove enrollment record
enrollmentsRouter.delete(
  "/:id",
  validateParams(numericIdParamSchema),
  deleteEnrollment,
);

export default enrollmentsRouter;
