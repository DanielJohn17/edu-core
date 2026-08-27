import { useBack, useShow } from "@refinedev/core";
import { useParams } from "react-router";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb.tsx";
import { ShowView } from "@/components/refine-ui/views/show-view.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Department } from "@/types";
import {
  MOCK_DEPARTMENT_CLASSES,
  MOCK_DEPARTMENT_STUDENTS,
  MOCK_DEPARTMENT_SUBJECTS,
  MOCK_DEPARTMENT_TEACHERS,
} from "@/constants/mock-data.ts";
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

export default function DepartmentsShow() {
  const { id } = useParams();
  const back = useBack();

  const { query } = useShow<Department>({
    resource: "departments",
    id,
  });

  const department = query.data?.data;
  const isLoading = query.isLoading;

  const departmentName = department?.name || "Biology";

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
    return `${parts[0][0] ?? ""}${
      parts[parts.length - 1][0] ?? ""
    }`.toUpperCase();
  };

  const getSubjectBadgeClass = (variant?: string) => {
    switch (variant) {
      case "blue":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-950/40 dark:text-blue-400";
      case "pink":
        return "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:bg-pink-950/40 dark:text-pink-400";
      case "purple":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-400";
      case "emerald":
      default:
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400";
    }
  };

  if (isLoading) {
    return (
      <ShowView className="space-y-6">
        <Breadcrumb />
        <p className="text-sm text-muted-foreground">Loading department details...</p>
      </ShowView>
    );
  }

  return (
    <ShowView className="space-y-6 pb-10">
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Back Button */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => back()}
          className="h-8 px-3 text-xs font-medium border-border flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="page-title text-3xl font-bold text-foreground tracking-tight">
          {departmentName}
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              query.refetch();
              toast.success("Department data refreshed.");
            }}
            className="h-8 px-3 text-xs font-medium border-border flex items-center gap-1.5"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Edit mode enabled.")}
            className="h-8 px-3 text-xs font-medium border-border flex items-center gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Subjects */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subjects
            </CardTitle>
            <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">12</div>
          </CardContent>
        </Card>

        {/* Card 2: Total Classes */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Classes
            </CardTitle>
            <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">37</div>
          </CardContent>
        </Card>

        {/* Card 3: Enrolled Students */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enrolled Students
            </CardTitle>
            <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">64</div>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Subjects Table */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Subjects</h2>

        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[120px]">
                  <p className="column-title ml-2">Code</p>
                </TableHead>
                <TableHead className="w-[200px]">
                  <p className="column-title">Subject</p>
                </TableHead>
                <TableHead className="w-[180px]">
                  <p className="column-title">Department</p>
                </TableHead>
                <TableHead>
                  <p className="column-title">Description</p>
                </TableHead>
                <TableHead className="w-[100px] text-right pr-6">
                  <p className="column-title justify-end">Action</p>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DEPARTMENT_SUBJECTS.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="py-3 pl-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {sub.code}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground py-3">
                    {sub.name}
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSubjectBadgeClass(
                        sub.departmentVariant,
                      )}`}
                    >
                      {sub.department}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm py-3 max-w-md truncate">
                    {sub.description}
                  </TableCell>
                  <TableCell className="text-right py-3 pr-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-medium border-border"
                      onClick={() => toast.info(`Viewing subject ${sub.name}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section 2: Departments / Classes Table */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Departments</h2>

        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[80px]">
                  <p className="column-title ml-2">Banner</p>
                </TableHead>
                <TableHead className="w-[220px]">
                  <p className="column-title">Class name</p>
                </TableHead>
                <TableHead className="w-[140px]">
                  <p className="column-title">Subject</p>
                </TableHead>
                <TableHead className="w-[180px]">
                  <p className="column-title">Teacher</p>
                </TableHead>
                <TableHead className="w-[120px]">
                  <p className="column-title">Status</p>
                </TableHead>
                <TableHead className="w-[100px]">
                  <p className="column-title">Capacity</p>
                </TableHead>
                <TableHead className="w-[100px] text-right pr-6">
                  <p className="column-title justify-end">Details</p>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DEPARTMENT_CLASSES.map((cls) => (
                <TableRow
                  key={cls.id}
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="py-3 pl-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {cls.name.charAt(0)}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground py-3">
                    {cls.name}
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSubjectBadgeClass(
                        cls.subjectVariant,
                      )}`}
                    >
                      {cls.subject}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={cls.teacher.avatar}
                          alt={cls.teacher.name}
                        />
                        <AvatarFallback>
                          {getInitials(cls.teacher.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground leading-tight">
                          {cls.teacher.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-tight">
                          {cls.teacher.username}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground py-3">
                    {cls.capacity}
                  </TableCell>
                  <TableCell className="text-right py-3 pr-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-medium border-border"
                      onClick={() => toast.info(`Viewing class ${cls.name}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section 3: Teachers & Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Teachers */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Teachers</h2>

          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead>
                    <p className="column-title ml-2">Name</p>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <p className="column-title">Role</p>
                  </TableHead>
                  <TableHead className="w-[100px] text-right pr-6">
                    <p className="column-title justify-end">Action</p>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DEPARTMENT_TEACHERS.map((teacher) => (
                  <TableRow
                    key={teacher.id}
                    className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={teacher.avatar}
                            alt={teacher.name}
                          />
                          <AvatarFallback>
                            {getInitials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">
                            {teacher.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {teacher.username}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {teacher.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-3 pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-medium border-border"
                        onClick={() =>
                          toast.info(`Viewing teacher ${teacher.name}`)
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right Column: Students */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Teachers</h2>

          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead>
                    <p className="column-title ml-2">Name</p>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <p className="column-title">Role</p>
                  </TableHead>
                  <TableHead className="w-[100px] text-right pr-6">
                    <p className="column-title justify-end">Action</p>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DEPARTMENT_STUDENTS.map((student) => (
                  <TableRow
                    key={student.id}
                    className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={student.avatar}
                            alt={student.name}
                          />
                          <AvatarFallback>
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">
                            {student.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {student.username}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        {student.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-3 pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-medium border-border"
                        onClick={() =>
                          toast.info(`Viewing student ${student.name}`)
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </ShowView>
  );
}
