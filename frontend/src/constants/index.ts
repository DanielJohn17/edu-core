export const DEPARTMENTS = ["CS", "Math", "English"];

export const DEPARTMENT_OPTIONS = DEPARTMENTS.map((dept) => ({
  value: dept,
  label: dept,
}));

export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
