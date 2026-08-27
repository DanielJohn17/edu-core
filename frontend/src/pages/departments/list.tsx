import { ListView } from "@/components/refine-ui/views/list-view.tsx";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb.tsx";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { CreateButton } from "@/components/refine-ui/buttons/create.tsx";
import { DataTable } from "@/components/refine-ui/data-table/data-table.tsx";
import { useTable } from "@refinedev/react-table";
import { Department } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { ShowButton } from "@/components/refine-ui/buttons/show.tsx";

export default function DepartmentsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("id-desc");

  const searchFilters = searchQuery
    ? [{ field: "name", operator: "contains" as const, value: searchQuery }]
    : [];

  const currentSorters = useMemo(() => {
    switch (selectedSort) {
      case "name-asc":
        return [{ field: "name", order: "asc" as const }];
      case "name-desc":
        return [{ field: "name", order: "desc" as const }];
      case "code-asc":
        return [{ field: "code", order: "asc" as const }];
      default:
        return [{ field: "id", order: "desc" as const }];
    }
  }, [selectedSort]);

  const departmentColumns = useMemo<ColumnDef<Department>[]>(
    () => [
      {
        id: "code",
        accessorKey: "code",
        size: 120,
        header: () => <p className="column-title ml-2">Code</p>,
        cell: ({ getValue }) => (
          <div className="ml-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30">
              {getValue<string>()}
            </span>
          </div>
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        size: 200,
        header: () => <p className="column-title">Name</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground font-semibold">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "description",
        accessorKey: "description",
        size: 360,
        header: () => <p className="column-title">Description</p>,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground truncate line-clamp-1">
            {getValue<string | null>() ?? "-"}
          </span>
        ),
      },
      {
        id: "details",
        size: 100,
        header: () => <p className="column-title">Action</p>,
        cell: ({ row }) => (
          <ShowButton
            resource="departments"
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

  const departmentTable = useTable<Department>({
    columns: departmentColumns,
    refineCoreProps: {
      resource: "departments",
      pagination: { pageSize: 10, mode: "server" },
      filters: {
        permanent: [...searchFilters],
      },
      sorters: {
        permanent: currentSorters,
      },
    },
  });

  return (
    <ListView>
      <Breadcrumb />

      <h1 className="page-title">Departments</h1>

      <div className="intro-row">
        <p>Manage and browse all departments in the institution.</p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />

            <Input
              type="text"
              placeholder="Search by name or code..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="id-desc">Latest Added</SelectItem>
                <SelectItem value="name-asc">Name (A - Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z - A)</SelectItem>
                <SelectItem value="code-asc">Code (A - Z)</SelectItem>
              </SelectContent>
            </Select>

            <CreateButton resource="departments" />
          </div>
        </div>
      </div>

      <DataTable table={departmentTable} />
    </ListView>
  );
}
