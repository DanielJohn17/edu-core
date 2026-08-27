export type Subject = {
  id: number;
  name: string;
  code: string;
  description: string;
  department: string;
  createdAt: string;
};

export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export type User = {
  id: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
  imageCldPubId?: string;
  department?: string;
};

export type Schedule = {
  day: string;
  startTime: string;
  endTime: string;
};

export type Department = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DepartmentSubject = {
  id: number;
  code: string;
  name: string;
  description: string | null;
};

export type DepartmentClass = {
  id: number;
  name: string;
  capacity: number;
  status: "active" | "inactive" | "archived";
  subject: { id: number; name: string; code: string } | null;
  teacher: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
};

export type DepartmentStats = {
  totalSubjects: number;
  totalClasses: number;
  enrolledStudents: number;
};

export type DepartmentTeacher = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
};

export type DepartmentDetail = Department & {
  subjects: DepartmentSubject[];
  classes: DepartmentClass[];
  teachers: DepartmentTeacher[];
  stats: DepartmentStats;
};

export type ClassDetails = {
  id: number;
  name: string;
  description: string;
  status: "active" | "inactive";
  capacity: number;
  courseCode: string;
  courseName: string;
  bannerUrl?: string;
  bannerCldPubId?: string;
  subject?: Subject;
  teacher?: User;
  department?: Department;
  schedules: Schedule[];
  inviteCode?: string;
};

export type SignUpPayload = {
  email: string;
  name: string;
  password: string;
  image?: string;
  imageCldPubId?: string;
  role: UserRole;
};

export type Enrollment = {
  id: number;
  studentId: string;
  classId: number;
  createdAt: string;
  student?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string;
    department?: string;
  };
  class?: {
    id: number;
    name: string;
    capacity: number;
    status: "active" | "inactive" | "archived";
    inviteCode: string;
    bannerUrl?: string | null;
    schedules?: Schedule[];
  };
  subject?: {
    id: number;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export type CreateEnrollmentPayload = {
  studentId: string;
  classId: number;
};

export type JoinClassPayload = {
  studentId: string;
  inviteCode: string;
};

export type ListResponse<T = unknown> = {
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateResponse<T = unknown> = {
  data: T;
};

export type GetOneResponse<T = unknown> = {
  data?: T;
};

declare global {
  interface CloudinaryUploadWidgetResults {
    event: string;
    info: {
      secure_url: string;
      public_id: string;
      delete_token?: string;
      resource_type: string;
      original_filename: string;
    };
  }

  interface CloudinaryWidget {
    open: () => void;
  }

  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (
          error: unknown,
          result: CloudinaryUploadWidgetResults,
        ) => void,
      ) => CloudinaryWidget;
    };
  }
}

export interface UploadWidgetValue {
  url: string;
  publicId: string;
}

export interface UploadWidgetProps {
  value?: UploadWidgetValue | null;
  onChange?: (value: UploadWidgetValue | null) => void;
  disabled?: boolean;
}
