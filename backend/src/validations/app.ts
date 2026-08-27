import { z } from "zod";

// Common / Utility Schemas
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export const numericIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid ID parameter"),
});

export const stringIdParamSchema = z.object({
  id: z.string().trim().min(1, "Invalid ID parameter"),
});

export const scheduleSchema = z.object({
  day: z.string().trim().min(1, "Day is required"),
  startTime: z.string().trim().min(1, "Start time is required"),
  endTime: z.string().trim().min(1, "End time is required"),
});

// Department Schemas
export const createDepartmentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Department code is required")
    .max(50, "Department code must be at most 50 characters"),
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(255, "Department name must be at most 255 characters"),
  description: z
    .string()
    .trim()
    .max(255, "Description must be at most 255 characters")
    .optional()
    .nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const departmentQuerySchema = paginationQuerySchema.extend({
  code: z.string().trim().optional(),
  name: z.string().trim().optional(),
});

// Subject Schemas
export const createSubjectSchema = z.object({
  departmentId: z.coerce
    .number()
    .int("Department ID must be an integer")
    .positive("Department ID must be a positive number"),
  code: z
    .string()
    .trim()
    .min(1, "Subject code is required")
    .max(50, "Subject code must be at most 50 characters"),
  name: z
    .string()
    .trim()
    .min(1, "Subject name is required")
    .max(255, "Subject name must be at most 255 characters"),
  description: z
    .string()
    .trim()
    .max(255, "Description must be at most 255 characters")
    .optional()
    .nullable(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const subjectQuerySchema = paginationQuerySchema.extend({
  department: z.string().trim().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

// Class Schemas
export const classStatusEnum = z.enum(["active", "inactive", "archived"]);

export const createClassSchema = z.object({
  subjectId: z.coerce
    .number()
    .int("Subject ID must be an integer")
    .positive("Subject ID must be a positive number"),
  teacherId: z
    .string()
    .trim()
    .min(1, "Teacher is required"),
  name: z
    .string()
    .trim()
    .min(3, "Class name must be at least 3 characters")
    .max(255, "Class name must be at most 255 characters"),
  inviteCode: z
    .string()
    .trim()
    .max(50, "Invite code must be at most 50 characters")
    .optional(),
  bannerCldPubId: z.string().trim().optional().nullable(),
  bannerUrl: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  capacity: z.coerce
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .default(50),
  status: classStatusEnum.default("active"),
  schedules: z.array(scheduleSchema).default([]),
});

export const updateClassSchema = createClassSchema.partial();

export const classQuerySchema = paginationQuerySchema.extend({
  subject: z.string().trim().optional(),
  subjectId: z.coerce.number().int().positive().optional(),
  teacherId: z.string().trim().optional(),
  status: classStatusEnum.optional(),
});

// Enrollment Schemas
export const createEnrollmentSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required"),
  classId: z.coerce
    .number()
    .int("Class ID must be an integer")
    .positive("Class ID must be a positive number"),
});

export const enrollByInviteCodeSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required"),
  inviteCode: z
    .string()
    .trim()
    .min(1, "Invite code is required")
    .max(50, "Invite code must be at most 50 characters"),
});

export const enrollmentQuerySchema = paginationQuerySchema.extend({
  studentId: z.string().trim().optional(),
  classId: z.coerce.number().int().positive().optional(),
  teacherId: z.string().trim().optional(),
  subjectId: z.coerce.number().int().positive().optional(),
});

// User / Query Schemas
export const userQuerySchema = paginationQuerySchema.extend({
  role: z.enum(["student", "teacher", "admin"]).optional(),
});

// Inferred TypeScript types
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type EnrollByInviteCodeInput = z.infer<typeof enrollByInviteCodeSchema>;
