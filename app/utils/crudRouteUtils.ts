import {
  redirect,
  type ClientActionFunctionArgs,
  type ClientLoaderFunctionArgs,
} from "react-router";

import { getErrorMessage } from "./apiUtils";
import { toastSearchParam } from "../routes/layout/index";
import { OperationCanceledException } from "typescript";

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

type CrudActionConfig<TRequest extends object> = {
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

export function createClientAction<TRequest extends object>({
  createRecord,
  updateRecord,
  deleteRecord,
  listRouteUrl,
}: CrudActionConfig<TRequest>) {
  return async function clientAction({ request, params }: ClientActionFunctionArgs) {
    const { operation, id } = validateCrudRouteParams(params);
    const requestedOp = {
      create: { sendRequest: (apiRequest: TRequest) => createRecord(apiRequest), successCode: 201 },
      update: { sendRequest: (apiRequest: TRequest) => updateRecord(id, apiRequest), successCode: 200 },
      delete: { sendRequest: () => deleteRecord(id), successCode: 204 },
      view: { sendRequest: () => { throw OperationCanceledException }, successCode: NaN },
    }

    const apiRequest = await request.json() as TRequest;
    Object.assign(apiRequest, { updatedBy: "user" });
    const response = await requestedOp[operation].sendRequest(apiRequest);

    return requestedOp[operation].successCode === response.status
      ? redirect(`${listRouteUrl}?${toastSearchParam}=Success`)
      : { actionError: getErrorMessage(response.data, response.status) };
  };
}
