import { getDefaultFilter, useShow } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useParams } from "react-router";
import {
  ShowView,
  ShowViewHeader,
} from "@/components/refine-ui/views/show-view.tsx";
import { DataTable } from "@/components/refine-ui/data-table/data-table.tsx";
import { ShowButton } from "@/components/refine-ui/buttons/show.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { MoreVertical, Search } from "lucide-react";
import {
  DepartmentDetail,
  DepartmentSubject,
  DepartmentClass,
  DepartmentTeacher,
} from "@/types";

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return (parts[0][0] ?? "").toUpperCase();
  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    case "inactive":
      return "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20";
    case "archived":
      return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
};

export default function DepartmentsShow() {
  const { id } = useParams();
  const departmentId = id ?? "";

  const { query } = useShow<DepartmentDetail>({
    resource: "departments",
    id: departmentId,
  });

  const department = query.data?.data;
  const isLoading = query.isLoading;
  const departmentName = department?.name ?? "Department";
  const stats = department?.stats ?? {
    totalSubjects: 0,
    totalClasses: 0,
    enrolledStudents: 0,
  };

  // ---------- Subjects table ----------
  const subjectColumns = useMemo<ColumnDef<DepartmentSubject>[]>(
    () => [
      {
        id: "code",
        accessorKey: "code",
        size: 120,
        header: () => <p className="column-title ml-2">Code</p>,
        cell: ({ getValue }) => (
          <div className="ml-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {getValue<string>()}
            </span>
          </div>
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        size: 220,
        header: () => <p className="column-title">Subject</p>,
        cell: ({ getValue }) => (
          <span className="font-semibold text-foreground">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "description",
        accessorKey: "description",
        header: () => <p className="column-title">Description</p>,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm truncate">
            {getValue<string | null>() ?? "-"}
          </span>
        ),
      },
      {
        id: "action",
        size: 100,
        header: () => <p className="column-title">Action</p>,
        cell: ({ row }) => (
          <ShowButton
            resource="subjects"
            recordItemId={row.original.id}
            variant="outline"
            size="sm"
          >
            View
          </ShowButton>
        ),
      },
    ],
    [],
  );

  const subjectsTable = useTable<DepartmentSubject>({
    columns: subjectColumns,
    refineCoreProps: {
      resource: `departments/${departmentId}/subjects`,
      pagination: { pageSize: 5, mode: "server" },
    },
  });

  // ---------- Classes table ----------
  const classColumns = useMemo<ColumnDef<DepartmentClass>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        size: 220,
        header: () => <p className="column-title ml-2">Class name</p>,
        cell: ({ getValue }) => (
          <span className="font-semibold text-foreground ml-2">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "subject",
        size: 160,
        header: () => <p className="column-title">Subject</p>,
        cell: ({ row }) =>
          row.original.subject ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
              {row.original.subject.name}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
      },
      {
        id: "teacher",
        size: 200,
        header: () => <p className="column-title">Teacher</p>,
        cell: ({ row }) => {
          const teacher = row.original.teacher;
          if (!teacher) {
            return <span className="text-muted-foreground text-xs">-</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={teacher.image ?? undefined}
                  alt={teacher.name}
                />
                <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground leading-tight">
                  {teacher.name}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {teacher.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        size: 120,
        header: () => <p className="column-title">Status</p>,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                status,
              )}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        id: "capacity",
        accessorKey: "capacity",
        size: 100,
        header: () => <p className="column-title">Capacity</p>,
        cell: ({ getValue }) => (
          <span className="font-semibold text-foreground">
            {getValue<number>()}
          </span>
        ),
      },
      {
        id: "action",
        size: 100,
        header: () => <p className="column-title justify-end">Details</p>,
        cell: ({ row }) => (
          <ShowButton
            resource="classes"
            recordItemId={row.original.id}
            variant="outline"
            size="sm"
          >
            View
          </ShowButton>
        ),
      },
    ],
    [],
  );

  const classesTable = useTable<DepartmentClass>({
    columns: classColumns,
    refineCoreProps: {
      resource: `departments/${departmentId}/classes`,
      pagination: { pageSize: 5, mode: "server" },
    },
  });

  // ---------- Teachers table ----------
  const teacherColumns = useMemo<ColumnDef<DepartmentTeacher>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        size: 240,
        header: () => <p className="column-title ml-2">Name</p>,
        cell: ({ row }) => {
          const teacher = row.original;
          const handle = teacher.email
            ? `@${teacher.email.split("@")[0]}`
            : "";
          return (
            <div className="flex items-center gap-3 ml-2">
              <Avatar className="h-8 w-8">
                {teacher.image && (
                  <AvatarImage src={teacher.image} alt={teacher.name} />
                )}
                <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground leading-tight">
                  {teacher.name}
                </span>
                {handle && (
                  <span className="text-xs text-muted-foreground leading-tight">
                    {handle}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        accessorKey: "role",
        size: 140,
        header: () => <p className="column-title">Role</p>,
        cell: ({ getValue }) => {
          const role = getValue<string>() ?? "Teacher";
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          );
        },
      },
      {
        id: "action",
        size: 100,
        header: () => <p className="column-title justify-end">Action</p>,
        cell: ({ row }) => (
          <ShowButton
            resource="users"
            recordItemId={row.original.id}
            variant="outline"
            size="sm"
          >
            View
          </ShowButton>
        ),
      },
    ],
    [],
  );

  const teachersTable = useTable<DepartmentTeacher>({
    columns: teacherColumns,
    refineCoreProps: {
      resource: `departments/${departmentId}/teachers`,
      pagination: { pageSize: 5, mode: "server" },
    },
  });

  if (isLoading) {
    return (
      <ShowView className="space-y-6">
        <ShowViewHeader resource="departments" title="Department Details" />
        <p className="text-sm text-muted-foreground">
          Loading department details...
        </p>
      </ShowView>
    );
  }

  // Read filter values directly from Refine's table state
  const subjectSearchValue =
    (getDefaultFilter("name", subjectsTable.refineCore.filters) as string) ?? "";
  const classSearchValue =
    (getDefaultFilter("name", classesTable.refineCore.filters) as string) ?? "";
  const classStatusValue =
    (getDefaultFilter("status", classesTable.refineCore.filters) as string) ?? "all";
  const teacherSearchValue =
    (getDefaultFilter("name", teachersTable.refineCore.filters) as string) ?? "";
  const teacherRoleValue =
    (getDefaultFilter("role", teachersTable.refineCore.filters) as string) ?? "all";

  return (
    <ShowView className="space-y-6 pb-10">
      <ShowViewHeader resource="departments" title={departmentName} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subjects
            </CardTitle>
            <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.totalSubjects}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Classes
            </CardTitle>
            <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.totalClasses}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enrolled Students
            </CardTitle>
            <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.enrolledStudents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Subjects */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>Subjects</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search subjects..."
              className="pl-9 h-9 text-sm"
              value={subjectSearchValue}
              onChange={(e) => {
                const val = e.target.value;
                subjectsTable.refineCore.setFilters(
                  val
                    ? [{ field: "name", operator: "contains", value: val }]
                    : [],
                  "replace",
                );
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable table={subjectsTable} />
        </CardContent>
      </Card>

      {/* Section 2: Classes */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>Classes</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search classes..."
                className="pl-9 h-9 text-sm"
                value={classSearchValue}
                onChange={(e) => {
                  const val = e.target.value;
                  classesTable.refineCore.setFilters(
                    [
                      {
                        field: "name",
                        operator: "contains",
                        value: val || undefined,
                      },
                    ],
                    "merge",
                  );
                }}
              />
            </div>
            <Select
              value={classStatusValue}
              onValueChange={(val) => {
                classesTable.refineCore.setFilters(
                  [
                    {
                      field: "status",
                      operator: "eq",
                      value: val === "all" ? undefined : val,
                    },
                  ],
                  "merge",
                );
              }}
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable table={classesTable} />
        </CardContent>
      </Card>

      {/* Section 3: Teachers */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>Teachers</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search teachers..."
                className="pl-9 h-9 text-sm"
                value={teacherSearchValue}
                onChange={(e) => {
                  const val = e.target.value;
                  teachersTable.refineCore.setFilters(
                    [
                      {
                        field: "name",
                        operator: "contains",
                        value: val || undefined,
                      },
                    ],
                    "merge",
                  );
                }}
              />
            </div>
            <Select
              value={teacherRoleValue}
              onValueChange={(val) => {
                teachersTable.refineCore.setFilters(
                  [
                    {
                      field: "role",
                      operator: "eq",
                      value: val === "all" ? undefined : val,
                    },
                  ],
                  "merge",
                );
              }}
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable table={teachersTable} />
        </CardContent>
      </Card>
    </ShowView>
  );
}
