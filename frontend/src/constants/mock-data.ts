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

export { MOCK_SUBJECTS, TEACHERS, SUBJECTS };
