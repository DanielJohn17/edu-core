import { Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import routerProvider, {
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { dataProvider } from "./providers/data";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import "./App.css";
import { lazy, Suspense } from "react";
import { BookOpen, Building2, GraduationCap, Home } from "lucide-react";
import { Layout } from "./components/refine-ui/layout/layout";

const Dashboard = lazy(() => import("./pages/dashboard"));
const ClassesCreate = lazy(() => import("./pages/classes/create"));
const ClassesList = lazy(() => import("./pages/classes/list"));
const ClassesShow = lazy(() => import("@/pages/classes/show"));
const SubjectsList = lazy(() => import("./pages/subjects/list"));
const SubjectsCreate = lazy(() => import("./pages/subjects/create"));
const DepartmentsList = lazy(() => import("./pages/departments/list"));
const DepartmentsShow = lazy(() => import("./pages/departments/show"));

function PageLoader() {
  return (
    <div className="flex h-40 w-full items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "HxeGNI-Nw1HJ5-L0n1Yh",
              }}
              resources={[
                {
                  name: "dashboard",
                  list: "/",
                  meta: { label: "Home", icon: <Home /> },
                },
                {
                  name: "departments",
                  list: "/departments",
                  show: "/departments/show/:id",
                  meta: { label: "Departments", icon: <Building2 /> },
                },
                {
                  name: "subjects",
                  list: "/subjects",
                  create: "/subjects/create",
                  meta: { label: "Subjects", icon: <BookOpen /> },
                },
                {
                  name: "classes",
                  list: "/classes",
                  create: "/classes/create",
                  show: "/classes/show/:id",
                  meta: { label: "Classes", icon: <GraduationCap /> },
                },
              ]}
            >
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route
                    element={
                      <Layout>
                        <Outlet />
                      </Layout>
                    }
                  >
                    <Route path="/" element={<Dashboard />} />

                    <Route path="departments">
                      <Route index element={<DepartmentsList />} />
                      <Route path="show/:id" element={<DepartmentsShow />} />
                    </Route>

                    <Route path="subjects">
                      <Route index element={<SubjectsList />} />
                      <Route path="create" element={<SubjectsCreate />} />
                    </Route>

                    <Route path="classes">
                      <Route index element={<ClassesList />} />
                      <Route path="create" element={<ClassesCreate />} />
                      <Route path="show/:id" element={<ClassesShow />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
