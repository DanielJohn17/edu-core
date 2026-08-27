import { BACKEND_BASE_URL } from "@/constants";
import { MOCK_DEPARTMENTS } from "@/constants/mock-data";
import { CreateResponse, ListResponse } from "@/types";
import { DataProvider, GetOneResponse, HttpError } from "@refinedev/core";
import { createDataProvider, CreateDataProviderOptions } from "@refinedev/rest";

if (!BACKEND_BASE_URL)
  throw new Error(
    "VITE_BACKEND_BASE_URL environment variable is required but not set",
  );

const buildHttpError = async (res: Response): Promise<HttpError> => {
  let message = "Request failed.";

  try {
    const payload = (await res.json()) as { message?: string };

    if (payload?.message) message = payload.message;
  } catch {
    // Ignore error
  }

  return {
    message,
    statusCode: res.status,
  };
};

const options: CreateDataProviderOptions = {
  getList: {
    getEndpoint: ({ resource }) => resource,

    buildQueryParams: async ({ resource, filters, pagination }) => {
      const page = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 10;

      const params: Record<string, string | number> = { page, limit: pageSize };

      filters?.forEach((filter) => {
        const field = "field" in filter ? filter.field : "";

        const value = String(filter.value);

        if (resource === "subjects") {
          if (field === "department") params.department = value;
          if (field === "name" || field === "code") params.search = value;
        }

        if (resource === "departments") {
          if (field === "name" || field === "code") params.search = value;
        }
      });

      return params;
    },

    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response);

      const payload: ListResponse = await response.clone().json();

      return payload.data ?? [];
    },

    getTotalCount: async (response) => {
      if (!response.ok) throw await buildHttpError(response);

      const payload: ListResponse = await response.clone().json();

      return payload.pagination?.total ?? payload.data?.length ?? 0;
    },
  },

  getOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,

    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response);
      const json: GetOneResponse = await response.json();

      return json.data ?? [];
    },
  },

  create: {
    getEndpoint: ({ resource }) => resource,

    buildBodyParams: async ({ variables }) => variables,

    mapResponse: async (response) => {
      const json: CreateResponse = await response.json();

      return json.data ?? [];
    },
  },
};

const { dataProvider: baseDataProvider } = createDataProvider(
  BACKEND_BASE_URL,
  options,
);

const dataProvider: DataProvider = {
  ...baseDataProvider,
  getList: async (params) => {
    if (params.resource === "departments") {
      let data = [...MOCK_DEPARTMENTS];

      params.filters?.forEach((filter) => {
        if (!("field" in filter) || !filter.value || filter.value === "all") return;
        const field = filter.field;
        const val = String(filter.value);

        if (field === "name" || field === "code" || field === "search") {
          const search = val.toLowerCase();
          data = data.filter(
            (d) =>
              d.name.toLowerCase().includes(search) ||
              d.code.toLowerCase().includes(search) ||
              d.description.toLowerCase().includes(search),
          );
        }

        if (field === "departmentName") {
          data = data.filter(
            (d) => d.name.toLowerCase() === val.toLowerCase(),
          );
        }

        if (field === "headcountRange") {
          if (val === "small") data = data.filter((d) => d.department < 40);
          if (val === "medium")
            data = data.filter(
              (d) => d.department >= 40 && d.department <= 70,
            );
          if (val === "large") data = data.filter((d) => d.department > 70);
        }
      });

      if (params.sorters && params.sorters.length > 0) {
        const sorter = params.sorters[0];
        const field = sorter.field as keyof (typeof data)[0];
        const order = sorter.order;
        data.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (typeof valA === "string" && typeof valB === "string") {
            return order === "asc"
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
          }
          return order === "asc"
            ? Number(valA) - Number(valB)
            : Number(valB) - Number(valA);
        });
      }

      const page = params.pagination?.currentPage ?? 1;
      const pageSize = params.pagination?.pageSize ?? 10;
      const startIndex = (page - 1) * pageSize;
      const paginatedData = data.slice(startIndex, startIndex + pageSize);

      return {
        data: paginatedData as any,
        total: data.length,
      };
    }
    return baseDataProvider.getList(params);
  },
  getOne: async (params) => {
    if (params.resource === "departments") {
      const item = MOCK_DEPARTMENTS.find(
        (d) => String(d.id) === String(params.id),
      );
      return {
        data: (item ?? MOCK_DEPARTMENTS[0]) as any,
      };
    }
    return baseDataProvider.getOne(params);
  },
  create: async (params) => {
    if (params.resource === "departments") {
      const newDept = {
        id: Date.now(),
        ...(params.variables as any),
      };
      MOCK_DEPARTMENTS.unshift(newDept);
      return {
        data: newDept as any,
      };
    }
    return baseDataProvider.create(params);
  },
};

export { dataProvider };

