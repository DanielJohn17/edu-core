import { BACKEND_BASE_URL } from "@/constants";
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

    buildQueryParams: async ({ filters, pagination }) => {
      const page = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 10;

      const params: Record<string, string | number> = { page, limit: pageSize };

      filters?.forEach((filter) => {
        if (!("field" in filter) || filter.value === undefined || filter.value === null || filter.value === "" || filter.value === "all") {
          return;
        }

        const field = filter.field;
        const value = String(filter.value);

        if (field === "search" || field === "name" || field === "code" || field === "email") {
          params.search = value;
        } else if (field === "status") {
          params.status = value;
        } else if (field === "subject") {
          params.subject = value;
        } else if (field === "department") {
          params.department = value;
        } else if (field === "teacher" || field === "teacherId") {
          params.teacherId = value;
        } else if (field === "role") {
          params.role = value;
        } else {
          params[field] = value;
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

const { dataProvider } = createDataProvider(BACKEND_BASE_URL, options);

export { dataProvider };
