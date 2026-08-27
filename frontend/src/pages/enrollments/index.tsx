import { useBack, useCreate, useList, useNotification } from "@refinedev/core";
import { useState } from "react";
import { useNavigate } from "react-router";
import { CreateView } from "@/components/refine-ui/views/create-view";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassDetails, User } from "@/types";
import { Loader2, Mail } from "lucide-react";

export default function EnrollmentsPage() {
  const navigate = useNavigate();
  const back = useBack();
  const { open } = useNotification();
  const { mutate: createEnrollment, mutation } = useCreate();
  const isEnrolling = mutation?.isPending ?? false;

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [classCode, setClassCode] = useState<string>("");

  // Fetch available classes
  const { query: classesQuery } = useList<ClassDetails>({
    resource: "classes",
    pagination: { pageSize: 100 },
  });

  // Fetch student user (or current student)
  const { query: usersQuery } = useList<User>({
    resource: "users",
    pagination: { pageSize: 50 },
  });

  const classesList = classesQuery?.data?.data || [];
  const classesLoading = classesQuery.isLoading;

  const usersList = usersQuery?.data?.data || [];
  const currentStudent =
    usersList.find((u) => u.email === "adrian@jsm.dev") ||
    usersList.find((u) => u.role === "student") ||
    usersList[0];

  const studentEmail = currentStudent?.email || "adrian@jsm.dev";

  const handleClassChange = (val: string) => {
    setSelectedClassId(val);
    // Note: Do NOT auto-fill the code - the code must be provided by the teacher
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();

    if (!classCode.trim()) {
      open?.({
        type: "error",
        message: "Please enter the invite code provided by your teacher",
      });
      return;
    }

    if (!currentStudent?.id) {
      open?.({
        type: "error",
        message: "No active student account found",
      });
      return;
    }

    createEnrollment(
      {
        resource: "enrollments/join",
        values: {
          studentId: currentStudent.id,
          inviteCode: classCode.trim(),
        },
      },
      {
        onSuccess: (data: any) => {
          open?.({
            type: "success",
            message: "Successfully enrolled in class!",
          });
          const targetClassId =
            selectedClassId || data?.data?.classId || data?.data?.id;
          if (targetClassId) {
            navigate(`/classes/show/${targetClassId}`);
          }
        },
        onError: (error: any) => {
          open?.({
            type: "error",
            message: error?.message || "Failed to enroll in class",
          });
        },
      },
    );
  };

  return (
    <CreateView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Enroll in a class</h1>
      <div className="intro-row">
        <p className="text-sm text-muted-foreground">
          Select a class to enroll as the current user.
        </p>
        <Button variant="outline" onClick={() => back()}>
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="my-4 flex items-center justify-center">
        <Card className="class-form-card">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">
              Enrollment Form
            </CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="mt-6">
            <form onSubmit={handleEnroll} className="space-y-5">
              {/* Class Select */}
              <div className="space-y-2">
                <Label
                  htmlFor="class-select"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Class
                </Label>
                <Select
                  value={selectedClassId}
                  onValueChange={handleClassChange}
                  disabled={classesLoading}
                >
                  <SelectTrigger id="class-select" className="w-full h-10">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesList.map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email address */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={studentEmail}
                    disabled
                    className="pl-9 h-10 bg-muted/30 text-foreground"
                  />
                </div>
              </div>

              {/* Code */}
              <div className="space-y-2">
                <Label
                  htmlFor="code"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter code from teacher (e.g. JHAISGDA)"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="h-10 uppercase font-mono tracking-wider"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isEnrolling || !classCode.trim()}
                  className="w-full"
                >
                  {isEnrolling ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enrolling...
                    </span>
                  ) : (
                    "Enroll now"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </CreateView>
  );
}
