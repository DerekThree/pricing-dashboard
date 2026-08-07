import {
  redirect,
  type ClientActionFunctionArgs,
  type ClientLoaderFunctionArgs,
} from "react-router";

import { getErrorMessage } from "./apiUtils";
import { toastSearchParam } from "../routes/layout/index";

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
      id: Number(params.id),
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

type CrudLoaderConfig<TRequest, TResponse extends ApiResponse> = {
  getRecord(id: number): Promise<TResponse>;
  emptyFormValues: TRequest;
};

type CrudActionConfig<TRequest> = {
  createRecord(record: TRequest): Promise<ApiResponse>;
  updateRecord(id: number, record: TRequest): Promise<ApiResponse>;
  deleteRecord(id: number): Promise<ApiResponse>;
  listRouteUrl: string;
  mapFormDataToRequest?: (formData: FormData) => TRequest;
};

export function createClientLoader<TRequest, TResponse extends ApiResponse>({
  getRecord,
  emptyFormValues,
}: CrudLoaderConfig<TRequest, TResponse>) {
  return async function clientLoader({ params }: ClientLoaderFunctionArgs) {
    const { operation, id } = validateCrudRouteParams(params);
    let initialFormValues: TRequest = emptyFormValues;
    let loaderError: string | null = null;

    if (operation !== crudOps.create) {
      const response = await getRecord(id);

      if (response.status === 200) {
        initialFormValues = response.data as TRequest;
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
  mapFormDataToRequest,
}: CrudActionConfig<TRequest>) {
  return async function clientAction({ request, params }: ClientActionFunctionArgs) {
    const { operation, id } = validateCrudRouteParams(params);
    let response: ApiResponse;
    let success: boolean;

    if (operation === crudOps.create || operation === crudOps.update) {
      const formData = await request.formData();
      formData.set("updatedBy", "user");
      const apiRequest = mapFormDataToRequest
        ? mapFormDataToRequest(formData)
        : (Object.fromEntries(formData) as TRequest);

      if (operation === crudOps.create) {
        response = await createRecord(apiRequest);
        success = response.status === 201;
      } else {
        response = await updateRecord(id, apiRequest);
        success = response.status === 200;
      }
    } else if (operation === crudOps.delete) {
      response = await deleteRecord(id);
      success = response.status === 204;
    } else {
      return { actionError: "View pages cannot submit changes." };
    }

    return success
      ? redirect(`${listRouteUrl}?${toastSearchParam}=Success`)
      : { actionError: getErrorMessage(response.data, response.status) };
  };
}
