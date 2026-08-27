# Implementation Plan - Backend Auth Validation, Auth Middleware & RBAC

Implement robust authentication validation, session-aware authentication middleware, and granular Role-Based Access Control (RBAC) across all backend routes using Better Auth, Drizzle ORM, and Zod.

## User Review Required

> [!IMPORTANT]
> - **Teacher Subject/Department Assignment**: To support "teacher creates classes based on their assigned subject and department" and "admin assigns or removes teachers from subjects/departments/faculty", we introduce `department_teachers` and `subject_teachers` tables in Drizzle schema with corresponding migration.
> - **Class Code Visibility**: Invite codes (`inviteCode`) will be protected so that only class owners (the assigned teacher) and admins can view them, preventing unauthorized student code leaks.
> - **Self-Scoped Operations**: Students cannot submit arbitrary `studentId`s in enrollment requests; the middleware will automatically bind or verify against `req.user.id`.

---

## Architecture & Design Overview

```mermaid
flowchart TD
    Client[Client Request] --> AuthMW[Auth Middleware (better-auth / session)]
    AuthMW --> SecurityMW[Arcjet Security / Rate Limit MW]
    SecurityMW --> RoleMW[RBAC Middleware: requireRole('admin' | 'teacher' | 'student')]
    RoleMW --> ValidateMW[Zod Request Validation: body/query/params]
    RoleMW --> OwnershipMW[Resource Ownership / Scope Check]
    OwnershipMW --> RouteHandler[Controller / Database Queries]
```

### 1. Roles & Permissions Matrix

| Resource / Action | Admin | Teacher | Student | Public / Unauth |
| :--- | :---: | :---: | :---: | :---: |
| **Departments** | | | | |
| View list / detail | ✅ | ✅ | ✅ | ✅ |
| Create / Edit / Delete | ✅ | ❌ | ❌ | ❌ |
| Assign / Remove Teachers | ✅ | ❌ | ❌ | ❌ |
| **Subjects** | | | | |
| View list / detail | ✅ | ✅ | ✅ | ✅ |
| Create / Edit / Delete | ✅ | ❌ | ❌ | ❌ |
| Assign / Remove Teachers | ✅ | ❌ | ❌ | ❌ |
| **Classes** | | | | |
| View active classes | ✅ (all) | ✅ (all) | ✅ (active only) | ✅ (active only) |
| View invite codes (`inviteCode`) | ✅ | ✅ (own classes) | ❌ | ❌ |
| Create class | ✅ | ✅ (assigned subject/dept) | ❌ | ❌ |
| Edit / Delete class | ✅ | ✅ (own class only) | ❌ | ❌ |
| View enrolled students in class | ✅ | ✅ (own class only) | ❌ | ❌ |
| Get class code endpoint | ✅ | ✅ (own class only) | ❌ | ❌ |
| **Enrollments** | | | | |
| Enroll in class (`/enrollments`) | ✅ (any student) | ❌ | ✅ (self only) | ❌ |
| Join via invite code (`/enrollments/join`) | ✅ | ❌ | ✅ (self only) | ❌ |
| View enrollments | ✅ (all) | ✅ (own classes) | ✅ (own enrollments) | ❌ |
| Unenroll student | ✅ | ✅ (from own class) | ✅ (self unenroll) | ❌ |
| **Users & Dashboard** | | | | |
| View user list / filter roles | ✅ | ✅ (directory) | ❌ | ❌ |
| Update user role / faculty | ✅ | ❌ | ❌ | ❌ |
| View own profile (`/users/me`) | ✅ | ✅ | ✅ | ❌ |
| View dashboard / analytics stats | ✅ | ❌ | ❌ | ❌ |

---

## Proposed Changes

### Database & Schema

#### [MODIFY] [backend/src/db/schema/app.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/db/schema/app.ts)
- Add `departmentTeachers` table: `departmentId` (references `departments.id`), `teacherId` (references `user.id`), `createdAt`.
- Add `subjectTeachers` table: `subjectId` (references `subjects.id`), `teacherId` (references `user.id`), `createdAt`.
- Add Drizzle relations for `departmentTeachers` and `subjectTeachers` to `user`, `departments`, and `subjects`.

#### [MODIFY] [backend/src/express.d.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/express.d.ts)
- Update Express `Request` type declaration to include full session and user object:
  ```ts
  import type { User, Session } from "./db/schema/auth";

  declare global {
    namespace Express {
      interface Request {
        user?: User;
        session?: Session;
      }
    }
  }
  ```

---

### Middleware

#### [NEW] [backend/src/middleware/auth.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/middleware/auth.ts)
- `authenticate`: Extracts Better Auth session from headers/cookies using `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` and populates `req.user` and `req.session`. Does not block unauthenticated requests.
- `requireAuth`: Enforces that `req.user` is present. Returns `401 Unauthorized` if session is missing or invalid.
- `requireRole(...roles: UserRole[])`: Enforces that `req.user.role` is included in allowed `roles`. Returns `403 Forbidden` if unauthorized.

#### [MODIFY] [backend/src/middleware/security.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/middleware/security.ts)
- Ensure security rate limiting uses `req.user?.role ?? "guest"`.

---

### Validations & Schemas

#### [MODIFY] [backend/src/validations/app.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/validations/app.ts)
- Add `assignTeacherSchema` (`teacherId: z.string()`).
- Add `updateUserRoleSchema` (`role: z.enum(["student", "teacher", "admin"])`).
- Update `createClassSchema` so `teacherId` is optional for teachers (automatically inferred from `req.user.id`) and required for admins.
- Update `createEnrollmentSchema` so `studentId` is optional for students (automatically inferred from `req.user.id`) and required for admins.
- Add `updateProfileSchema` for user self-update (`name`, `image`, `imageCldPubId`).

---

### Route Endpoints & Controllers

#### [MODIFY] [backend/src/routes/users.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/routes/users.ts)
- `GET /api/users/me`: Returns the authenticated user's profile, role, and assignments.
- `PATCH /api/users/me`: Allows current user to update their own profile details.
- `GET /api/users`: Restricted to Admin and Teacher. Supports search, role filtering, pagination.
- `PATCH /api/users/:id/role`: Restricted to Admin. Allows promoting/demoting user roles (`student`, `teacher`, `admin`).
- `DELETE /api/users/:id`: Restricted to Admin.

#### [MODIFY] [backend/src/routes/department.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/routes/department.ts)
- `POST /api/departments`: `requireAuth`, `requireRole("admin")`.
- `PATCH /api/departments/:id`: `requireAuth`, `requireRole("admin")`.
- `DELETE /api/departments/:id`: `requireAuth`, `requireRole("admin")`.
- `POST /api/departments/:id/teachers`: `requireAuth`, `requireRole("admin")` - Assign teacher to department.
- `DELETE /api/departments/:id/teachers/:teacherId`: `requireAuth`, `requireRole("admin")` - Remove teacher from department.
- `GET /api/departments/:id/teachers`: Open/Authenticated - List assigned department faculty.

#### [MODIFY] [backend/src/routes/subject.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/routes/subject.ts)
- `POST /api/subjects`: `requireAuth`, `requireRole("admin")`.
- `PATCH /api/subjects/:id`: `requireAuth`, `requireRole("admin")`.
- `DELETE /api/subjects/:id`: `requireAuth`, `requireRole("admin")`.
- `POST /api/subjects/:id/teachers`: `requireAuth`, `requireRole("admin")` - Assign teacher to subject.
- `DELETE /api/subjects/:id/teachers/:teacherId`: `requireAuth`, `requireRole("admin")` - Remove teacher from subject.
- `GET /api/subjects/:id/teachers`: Open/Authenticated - List assigned subject faculty.

#### [MODIFY] [backend/src/routes/classes.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/routes/classes.ts)
- `GET /api/classes`: Scopes result based on role (Teachers see invite codes for their own classes; Students/Public see active classes without invite code; Admins see all).
- `GET /api/classes/:id`: Reveals `inviteCode` only to the class teacher or admin.
- `GET /api/classes/:id/code`: `requireAuth`, `requireRole("teacher", "admin")` - Verifies teacher owns the class (or is admin) and returns invite code.
- `GET /api/classes/:id/students`: `requireAuth`, `requireRole("teacher", "admin")` - Verifies teacher owns the class (or is admin) and returns enrolled students.
- `POST /api/classes`: `requireAuth`, `requireRole("teacher", "admin")`.
  - If teacher: enforces `teacherId = req.user.id` and verifies teacher is assigned to the subject/department.
- `PATCH /api/classes/:id`: `requireAuth`, `requireRole("teacher", "admin")`. Enforces ownership for teachers.
- `DELETE /api/classes/:id`: `requireAuth`, `requireRole("teacher", "admin")`. Enforces ownership for teachers.

#### [MODIFY] [backend/src/routes/enrollments.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/routes/enrollments.ts)
- `GET /api/enrollments`:
  - If student: automatically filters to `studentId = req.user.id`.
  - If teacher: filters to classes taught by `req.user.id` unless querying specific owned class.
  - If admin: allowed to query all.
- `POST /api/enrollments`: `requireAuth`.
  - If student: forces `studentId = req.user.id`.
  - If admin: can enroll any student.
- `POST /api/enrollments/join`: `requireAuth`. Student joins via class invite code (`studentId = req.user.id`).
- `DELETE /api/enrollments/:id`: `requireAuth`. Student can unenroll themselves, teacher can remove student from their class, admin can delete any enrollment.

#### [NEW] [backend/src/routes/dashboard.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/routes/dashboard.ts)
- `GET /api/dashboard/stats` or `GET /api/admin/stats`: `requireAuth`, `requireRole("admin")`.
  - Aggregates stats: total students, teachers, admins, departments, subjects, active/inactive classes, total enrollments, recent activity.

#### [MODIFY] [backend/src/index.ts](file:///home/danieljohn17/Desktop/workspace/edu-core/backend/src/index.ts)
- Mount `authenticate` middleware before routes and security middleware.
- Register `dashboardRouter` under `/api/dashboard`.

---

## Verification Plan

### Automated Database & Type Checking
- Run `pnpm --filter backend run db:generate` to generate migration for `department_teachers` and `subject_teachers`.
- Run `pnpm --filter backend run db:migrate` or verify drizzle migration files.
- Run `pnpm --filter backend run build` (tsc) to verify strict TypeScript type conformity.

### API Authorization Verification
- Test unauthenticated requests to protected endpoints -> Verify `401 Unauthorized`.
- Test student trying to access admin endpoints (e.g. `POST /api/subjects`, `DELETE /api/departments/:id`, `GET /api/dashboard/stats`) -> Verify `403 Forbidden`.
- Test teacher creating a class -> Verify `teacherId` is enforced to be their own user ID and assignment check succeeds.
- Test teacher trying to edit another teacher's class -> Verify `403 Forbidden`.
- Test teacher retrieving their own class invite code -> Verify `200 OK` with invite code.
- Test student joining class via invite code -> Verify student gets enrolled and `studentId` matches logged in user.
- Test admin performing faculty management, subject assignment, and viewing dashboard stats.
