import {
  redirect,
  type ClientActionFunctionArgs,
  type ClientLoaderFunctionArgs,
} from "react-router";

import { getErrorMessage } from "./apiUtils";

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

export function validateCrudRouteParams(params: ClientLoaderFunctionArgs["params"]) {
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

type ApiResponse = {
  status: number;
  data: unknown;
  headers: Headers;
};

type SuccessData<TResponse extends ApiResponse> =
  Extract<TResponse, { status: 200 }>["data"];

type CrudLoaderConfig<TRequest, TResponse extends ApiResponse> = {
  getRecord(id: number): Promise<TResponse>;
  emptyFormValues: TRequest;
  transformFormValues?: (formValues: SuccessData<TResponse>) => TRequest;
};

type CrudActionConfig<TRequest> = {
  createRecord(record: TRequest): Promise<ApiResponse>;
  updateRecord(id: number, record: TRequest): Promise<ApiResponse>;
  deleteRecord(id: number): Promise<ApiResponse>;
  listRouteUrl: string;
  arrayFields?: (keyof TRequest)[];
  transformFormValues?: (formValues: Record<string, unknown>) => TRequest;
};

export function createClientLoader<TRequest, TResponse extends ApiResponse>({
  getRecord,
  emptyFormValues,
  transformFormValues,
}: CrudLoaderConfig<TRequest, TResponse>) {
  return async function clientLoader({ params }: ClientLoaderFunctionArgs) {
    const { operation, id } = validateCrudRouteParams(params);
    let initialFormValues: TRequest | SuccessData<TResponse> = emptyFormValues;
    let loaderError: string | null = null;

    if (operation !== crudOps.create) {
      const response = await getRecord(Number(id));

      if (response.status === 200) {
        const loadedRecord = response.data as SuccessData<TResponse>;
        initialFormValues = transformFormValues ? transformFormValues(loadedRecord) : loadedRecord;
      } else {
        loaderError = getErrorMessage(response.data, response.status);
      }
    }

    return { operation, initialFormValues, loaderError };
  };
}

export function createClientAction<TRequest>({
  createRecord,
  updateRecord,
  deleteRecord,
  listRouteUrl,
  arrayFields = [],
  transformFormValues,
}: CrudActionConfig<TRequest>) {
  return async function clientAction({ request, params }: ClientActionFunctionArgs) {
    const { operation, id } = validateCrudRouteParams(params);
    let response: ApiResponse;
    let success: boolean;

    if (operation === crudOps.create || operation === crudOps.update) {
      const formData = await request.formData();
      const record = Object.fromEntries(formData) as Record<string, unknown>;
      record.updatedBy = "user";

      for (const field of arrayFields) {
        record[String(field)] = formData.getAll(String(field));
      }

      const transformedRecord = transformFormValues ? transformFormValues(record) : (record as TRequest);

      if (operation === crudOps.create) {
        response = await createRecord(transformedRecord);
        success = response.status === 201;
      } else {
        response = await updateRecord(Number(id), transformedRecord);
        success = response.status === 200;
      }
    } else if (operation === crudOps.delete) {
      response = await deleteRecord(Number(id));
      success = response.status === 204;
    } else {
      return { actionError: "View pages cannot submit changes." };
    }

    return success
      ? redirect(listRouteUrl)
      : { actionError: getErrorMessage(response.data, response.status) };
  };
}
