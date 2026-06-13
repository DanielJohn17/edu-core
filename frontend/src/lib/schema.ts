import * as z from "zod";

export const facultySchema = z.object({
  name: z.string().min(3, "Name Should be at least 3 characters"),
  emails: z.string().email(),
  role: z.enum(["admin", "student", "teacher"]),
  department: z.string(),
  image: z.string().optional(),
  imageCldPubId: z.string().optional(),
});

export const classSchema = z.object({
  name: z
    .string()
    .min(3, "Classes name must be at least 3 characters")
    .max(50, "Classes name must be at most 50 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .min(5, "Description must be at least 5 characters"),
  subjectId: z.coerce
    .number({
      required_error: "Subject is required",
      invalid_type_error: "Subject is required",
    })
    .min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  capacity: z.coerce
    .number({
      required_error: "Capacity is required",
      invalid_type_error: "Capacity is required",
    })
    .min(1, "Capacity must be at least 1"),
  status: z.enum(["active", "inactive"]),
  bannerUrl: z
    .string({ required_error: "Class banner is required" })
    .min(1, "Class banner is required"),
  bannerCldPubId: z.string({
    required_error: "Banner reference is required",
  }),
});
