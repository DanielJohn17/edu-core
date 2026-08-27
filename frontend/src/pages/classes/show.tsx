import { AdvancedImage } from "@cloudinary/react";
import { useCreate, useList, useNotification, useShow } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useParams } from "react-router";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import {
  ShowView,
  ShowViewHeader,
} from "@/components/refine-ui/views/show-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { bannerPhoto } from "@/lib/cloudinary";
import { ClassDetails, Enrollment, User } from "@/types";

export default function ClassesShow() {
  const { id } = useParams();
  const classId = id ?? "";
  const { open } = useNotification();
  const { mutate: joinClass, mutation } = useCreate();
  const isEnrolling = mutation?.isPending ?? false;

  const [inviteCode, setInviteCode] = useState("");

  const { query } = useShow<ClassDetails>({
    resource: "classes",
    id: classId,
  });

  // Fetch student users to identify the current active student
  const { query: usersQuery } = useList<User>({
    resource: "users",
    pagination: { pageSize: 50 },
  });

  const usersList = usersQuery?.data?.data || [];
  const currentStudent =
    usersList.find((u) => u.email === "adrian@jsm.dev") ||
    usersList.find((u) => u.role === "student") ||
    usersList[0];

  const classDetails = query.data?.data;

  const studentColumns = useMemo<ColumnDef<Enrollment>[]>(
    () => [
      {
        id: "name",
        accessorKey: "student.name",
        size: 240,
        header: () => <p className="column-title">Student</p>,
        cell: ({ row }) => {
          const student = row.original.student;
          const name = student?.name || "Student";
          const email = student?.email || "";
          const image = student?.image;

          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                {image && <AvatarImage src={image} alt={name} />}
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="truncate">{name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "details",
        size: 140,
        header: () => <p className="column-title">Details</p>,
        cell: ({ row }) => {
          const studentId = row.original.student?.id || row.original.studentId;
          return (
            <ShowButton
              resource="users"
              recordItemId={studentId}
              variant="outline"
              size="sm"
            >
              View
            </ShowButton>
          );
        },
      },
    ],
    [],
  );

  const studentsTable = useTable<Enrollment>({
    columns: studentColumns,
    refineCoreProps: {
      resource: "enrollments",
      pagination: {
        pageSize: 5,
        mode: "server",
      },
      filters: {
        permanent: [
          {
            field: "classId",
            operator: "eq",
            value: classId,
          },
        ],
      },
    },
  });

  const enrolledList =
    (studentsTable.refineCore.tableQuery?.data?.data as Enrollment[] | undefined) || [];
  const isAlreadyEnrolled =
    !!currentStudent?.id &&
    enrolledList.some(
      (e: Enrollment) =>
        e.studentId === currentStudent.id ||
        e.student?.id === currentStudent.id ||
        e.student?.email === currentStudent.email,
    );

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();

    if (isAlreadyEnrolled) return;

    if (!inviteCode.trim()) {
      open?.({
        type: "error",
        message: "Please enter the invite code given by your teacher",
      });
      return;
    }

    if (!currentStudent?.id) {
      open?.({
        type: "error",
        message: "No active student found",
      });
      return;
    }

    joinClass(
      {
        resource: "enrollments/join",
        values: {
          studentId: currentStudent.id,
          inviteCode: inviteCode.trim(),
        },
      },
      {
        onSuccess: () => {
          open?.({
            type: "success",
            message: `Successfully enrolled in ${classDetails?.name || "class"}!`,
          });
          setInviteCode("");
          studentsTable.refineCore.tableQuery?.refetch();
        },
        onError: (err: any) => {
          open?.({
            type: "error",
            message: err?.message || "Failed to enroll in class",
          });
        },
      },
    );
  };

  if (query.isLoading || query.isError || !classDetails) {
    return (
      <ShowView className="class-view class-show">
        <ShowViewHeader resource="classes" title="Class Details" />
        <p className="state-message">
          {query.isLoading
            ? "Loading class details..."
            : query.isError
              ? "Failed to load class details."
              : "Class details not found."}
        </p>
      </ShowView>
    );
  }

  const teacherName = classDetails.teacher?.name ?? "Unknown";
  const teacherInitials = teacherName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const placeholderUrl = `https://placehold.co/600x400?text=${encodeURIComponent(
    teacherInitials || "NA",
  )}`;

  return (
    <ShowView className="class-view class-show space-y-6">
      <ShowViewHeader resource="classes" title="Class Details" />

      <div className="banner">
        {classDetails.bannerUrl ? (
          classDetails.bannerUrl.includes("res.cloudinary.com") &&
          classDetails.bannerCldPubId ? (
            <AdvancedImage
              cldImg={bannerPhoto(
                classDetails.bannerCldPubId ?? "",
                classDetails.name,
              )}
              alt="Class Banner"
            />
          ) : (
            <img
              src={classDetails.bannerUrl}
              alt={classDetails.name}
              loading="lazy"
            />
          )
        ) : (
          <div className="placeholder" />
        )}
      </div>

      <Card className="details-card">
        {/* Class Details */}
        <div>
          <div className="details-header">
            <div>
              <h1>{classDetails.name}</h1>
              <p>{classDetails.description}</p>
            </div>

            <div>
              <Badge variant="outline">{classDetails.capacity} spots</Badge>
              <Badge
                variant={
                  classDetails.status === "active" ? "default" : "secondary"
                }
                data-status={classDetails.status}
              >
                {classDetails.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="details-grid">
            <div className="instructor">
              <p>👨‍🏫 Instructor</p>
              <div>
                <img
                  src={classDetails.teacher?.image ?? placeholderUrl}
                  alt={teacherName}
                />

                <div>
                  <p>{teacherName}</p>
                  <p>{classDetails?.teacher?.email}</p>
                </div>
              </div>
            </div>

            <div className="department">
              <p>🏛️ Department</p>

              <div>
                <p>{classDetails?.department?.name}</p>
                <p>{classDetails?.department?.description}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Subject Card */}
        <div className="subject">
          <p>📚 Subject</p>

          <div>
            <Badge variant="outline">
              Code: <span>{classDetails?.subject?.code}</span>
            </Badge>
            <p>{classDetails?.subject?.name}</p>
            <p>{classDetails?.subject?.description}</p>
          </div>
        </div>

        <Separator />

        {/* Enroll in Class Section */}
        <div className="join">
          <h2>🎓 Enroll in Class</h2>

          <ol>
            <li>Ask your teacher for the invite code.</li>
            <li>Enter the invite code below.</li>
            <li>Click &quot;Enroll&quot; to join the class.</li>
          </ol>
        </div>

        {!isAlreadyEnrolled && (
          <Input
            type="text"
            placeholder="Enter class code from teacher..."
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="uppercase font-mono tracking-wider"
          />
        )}

        <Button
          size="lg"
          className="w-full"
          disabled={isAlreadyEnrolled || isEnrolling || (!isAlreadyEnrolled && !inviteCode.trim())}
          onClick={handleEnroll}
        >
          {isAlreadyEnrolled ? "Already Enrolled" : isEnrolling ? "Enrolling..." : "Enroll"}
        </Button>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable table={studentsTable} />
        </CardContent>
      </Card>
    </ShowView>
  );
}

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
};
