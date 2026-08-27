const MOCK_SUBJECTS = [
  {
    id: 1,
    name: "Introduction to Programming",
    code: "CS101",
    department: "Computer Science",
    description:
      "Fundamentals of programming using Python, covering variables, control flow, functions, and basic data structures.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Calculus I",
    code: "MATH101",
    department: "Mathematics",
    description:
      "Limits, derivatives, and integrals of single-variable functions with applications in science and engineering.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "University Physics I",
    code: "PHYS101",
    department: "Physics",
    description:
      "Classical mechanics covering kinematics, Newton's laws, energy, momentum, and rotational motion.",
    createdAt: new Date().toISOString(),
  },
];

const TEACHERS = [
  { id: "1", name: "Alice Johnson" },
  { id: "2", name: "Bob Smith" },
  { id: "3", name: "Carol Williams" },
  { id: "4", name: "David Brown" },
  { id: "5", name: "Eve Davis" },
];

const SUBJECTS = [
  { id: 1, name: "Mathematics", code: "MATH" },
  { id: 2, name: "Computer Science", code: "CS" },
  { id: 3, name: "Physics", code: "PHYS" },
  { id: 4, name: "English", code: "ENG" },
  { id: 5, name: "Biology", code: "BIO" },
];

import { Department } from "@/types";

const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 1,
    code: "SCVHBRT",
    name: "Biology",
    description: "The study of life and living systems.",
    createdAt: "2022-01-06T00:00:00.000Z",
  },
  {
    id: 2,
    code: "AFGSR3G",
    name: "Mathematics",
    description: "The study of numbers, patterns, and logical structure.",
    createdAt: "2022-01-07T00:00:00.000Z",
  },
  {
    id: 3,
    code: "T4UWNJD",
    name: "Computer Science",
    description: "The study of computation, software, and algorithms.",
    createdAt: "2022-01-08T00:00:00.000Z",
  },
  {
    id: 4,
    code: "JMNYRTG",
    name: "Business",
    description: "The study of how organizations create and manage value.",
    createdAt: "2022-01-09T00:00:00.000Z",
  },
  {
    id: 5,
    code: "M4HHXGH",
    name: "History",
    description: "The study of past events and human societies.",
    createdAt: "2022-01-10T00:00:00.000Z",
  },
  {
    id: 6,
    code: "YUTDNMA",
    name: "Economics",
    description: "The study of decision-making under scarcity.",
    createdAt: "2022-01-11T00:00:00.000Z",
  },
  {
    id: 7,
    code: "UOIKYSDG",
    name: "Physics",
    description: "The study of matter, energy, and the laws of nature.",
    createdAt: "2022-01-12T00:00:00.000Z",
  },
  {
    id: 8,
    code: "KLPQ89A",
    name: "Chemistry",
    description: "The study of substances, their properties, and reactions.",
    createdAt: "2022-01-13T00:00:00.000Z",
  },
  {
    id: 9,
    code: "PSY9012",
    name: "Psychology",
    description: "The scientific study of the mind and behavior.",
    createdAt: "2022-01-14T00:00:00.000Z",
  },
  {
    id: 10,
    code: "LIT3456",
    name: "Literature",
    description: "The study of written works of artistic value.",
    createdAt: "2022-01-15T00:00:00.000Z",
  },
  {
    id: 11,
    code: "ENG7890",
    name: "Engineering",
    description: "The application of science and math to solve real-world problems.",
    createdAt: "2022-01-16T00:00:00.000Z",
  },
  {
    id: 12,
    code: "ART1122",
    name: "Fine Arts",
    description: "The exploration of visual expression, design, and culture.",
    createdAt: "2022-01-17T00:00:00.000Z",
  },
];

const MOCK_DEPARTMENT_SUBJECTS = [
  {
    id: 1,
    code: "SCVHBRT",
    name: "Programming",
    department: "Computer Science",
    departmentVariant: "blue",
    description: "Writing instructions for computers.",
  },
  {
    id: 2,
    code: "AFGSR3G",
    name: "Algebra",
    department: "Math",
    departmentVariant: "pink",
    description: "Working with symbols and equations.",
  },
  {
    id: 3,
    code: "T4UWNJD",
    name: "Climate Studies",
    department: "Geography",
    departmentVariant: "purple",
    description: "Weather patterns and change.",
  },
  {
    id: 4,
    code: "BIO101",
    name: "Cellular Biology",
    department: "Biology",
    departmentVariant: "emerald",
    description: "Structure and function of cellular systems.",
  },
];

const MOCK_DEPARTMENT_CLASSES = [
  {
    id: 1,
    name: "Finance Basics - Section A",
    subject: "Finance",
    subjectVariant: "blue",
    bannerIcon: "finance",
    teacher: {
      name: "Natali Craig",
      username: "@natali",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    status: "active",
    capacity: 34,
  },
  {
    id: 2,
    name: "Genetics - Research Focus",
    subject: "Genetics",
    subjectVariant: "pink",
    bannerIcon: "genetics",
    teacher: {
      name: "Candice Wu",
      username: "@candice",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    },
    status: "active",
    capacity: 76,
  },
  {
    id: 3,
    name: "General Biology Lab",
    subject: "Biology",
    subjectVariant: "purple",
    bannerIcon: "biology",
    teacher: {
      name: "Demi Wilkinson",
      username: "@demi",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    },
    status: "active",
    capacity: 15,
  },
];

const MOCK_DEPARTMENT_TEACHERS = [
  {
    id: 1,
    name: "Demi Wilkinson",
    username: "@demi",
    role: "Teacher",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    name: "Natali Craig",
    username: "@natali",
    role: "Teacher",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  },
];

const MOCK_DEPARTMENT_STUDENTS = [
  {
    id: 1,
    name: "Ryan Baker",
    username: "@ryan",
    role: "Student",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    name: "Orlando Diggs",
    username: "@orlando",
    role: "Student",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
  },
];

export {
  MOCK_SUBJECTS,
  TEACHERS,
  SUBJECTS,
  MOCK_DEPARTMENTS,
  MOCK_DEPARTMENT_SUBJECTS,
  MOCK_DEPARTMENT_CLASSES,
  MOCK_DEPARTMENT_TEACHERS,
  MOCK_DEPARTMENT_STUDENTS,
};
