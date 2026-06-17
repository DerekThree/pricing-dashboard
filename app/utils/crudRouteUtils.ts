import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";

export const crudOps = {
  create: "create",
  view: "view",
  update: "update",
  delete: "delete",
} as const;

export type CrudOperation =
  (typeof crudOps)[keyof typeof crudOps];

const validOperations = new Set<CrudOperation>(Object.values(crudOps));

export function isCrudOperation(operation: string): operation is CrudOperation {
  return validOperations.has(operation as CrudOperation);
}

function validateRouteParams(params: LoaderFunctionArgs["params"]) {
  if (!params.operation || !isCrudOperation(params.operation)) {
    throw new Response(
      `The requested page could not be found: ${params.operation} is not supported`,
      { status: 404 },
    );
  }

  if (params.operation === crudOps.create || (!!params.id && /^\d+$/.test(params.id))) {
    return {
      operation: params.operation,
      id: params.id,
    };
  }

  throw new Response(
    "The requested page could not be found. Missing or invalid record id",
    { status: 404 },
  );
}

function getErrorMessage(data: unknown, status?: number) {
  if (typeof data === "string" && data) {
    return data;
  }

  if (data && typeof data === "object") {
    const { detail, error, message, title } = data as Record<string, unknown>;
    const responseMessage = message ?? detail ?? error ?? title;

    if (typeof responseMessage === "string" && responseMessage) {
      return responseMessage;
    }
  }

  return status
    ? `The backend returned status ${status}.`
    : "The app cannot reach the backend right now. Please try again later.";
}

type ApiResponse = {
  status: number;
  data: unknown;
};

type SuccessData<TResponse extends ApiResponse> =
  Extract<TResponse, { status: 200 }>["data"];

type CrudRouteConfig<TRequest extends object, TResponse extends ApiResponse> = {
  emptyRecord: TRequest;
  listRouteUrl: string;
  getRecord(id: number): Promise<TResponse>;
  createRecord(record: TRequest): Promise<ApiResponse>;
  updateRecord(id: number, record: TRequest): Promise<ApiResponse>;
  deleteRecord(id: number): Promise<ApiResponse>;
};

export function createLoader<TRequest extends object, TResponse extends ApiResponse>({
  emptyRecord,
  getRecord,
}: CrudRouteConfig<TRequest, TResponse>) {
  return async function loader({ params }: LoaderFunctionArgs) {
    const { operation, id } = validateRouteParams(params);
    let record: TRequest | SuccessData<TResponse> = emptyRecord;
    let loaderError: string | null = null;

    if (operation !== crudOps.create) {
      try {
        const response = await getRecord(Number(id));

        if (response.status === 200) {
          record = response.data as SuccessData<TResponse>;
        } else {
          loaderError = getErrorMessage(response.data, response.status);
        }
      } catch (error) {
        loaderError = getErrorMessage(error);
      }
    }

    return { operation, record, loaderError };
  };
}

export function createAction<TRequest extends object, TResponse extends ApiResponse>({
  listRouteUrl,
  createRecord,
  updateRecord,
  deleteRecord,
}: CrudRouteConfig<TRequest, TResponse>) {
  return async function action({ request, params }: ActionFunctionArgs) {
    const { operation, id } = validateRouteParams(params);

    try {
      if (operation === crudOps.create || operation === crudOps.update) {
        const formData = await request.formData();
        const record = Object.fromEntries(formData) as TRequest;
        let response: ApiResponse;
        let success: boolean;

        if (operation === crudOps.create) {
          response = await createRecord(record);
          success = response.status === 201;
        } else {
          response = await updateRecord(Number(id), record);
          success = response.status === 200;
        }

        return success
          ? redirect(listRouteUrl)
          : { actionError: getErrorMessage(response.data, response.status) };
      }

      if (operation === crudOps.delete) {
        const response = await deleteRecord(Number(id));

        return response.status === 204
          ? redirect(listRouteUrl)
          : { actionError: getErrorMessage(response.data, response.status) };
      }
    } catch (error) {
      return { actionError: getErrorMessage(error) };
    }

    return { actionError: "View pages cannot submit changes." };
  };
}
