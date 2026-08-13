import {
  redirect,
  type ClientActionFunctionArgs,
  type ClientLoaderFunctionArgs,
} from "react-router";

import { getErrorMessage } from "./apiUtils";
import { showToast } from "./toast";
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

type ApiResponse<TData = unknown> = {
  status: number;
  data: TData;
  headers: Headers;
};

type CrudLoaderOptions<TOptions extends object> = {
  getOptions(id?: { recordId?: number }): Promise<ApiResponse>;
  emptyOptions: TOptions;
};

type CrudLoaderConfig<TRequest, TResponse extends ApiResponse> = {
  getRecord(id: number): Promise<TResponse>;
  emptyFormValues: TRequest;
};

type CrudLoaderWithOptionsConfig<
  TRequest,
  TResponse extends ApiResponse,
  TOptions extends object,
> =
  CrudLoaderConfig<TRequest, TResponse> & {
    options: CrudLoaderOptions<TOptions>;
  };

type CrudLoaderResult<TRequest> = {
  operation: CrudOperation;
  initialFormValues: TRequest;
  loaderError: string | null;
};

type CrudLoaderResultWithOptions<TRequest, TOptions extends object> =
  CrudLoaderResult<TRequest> & { options: TOptions };

type CrudActionConfig<TRequest extends object> = {
  createRecord(record: TRequest): Promise<ApiResponse>;
  updateRecord(id: number, record: TRequest): Promise<ApiResponse>;
  deleteRecord(id: number): Promise<ApiResponse>;
  listRouteUrl: string;
};

export function createClientLoader<
  TRequest,
  TResponse extends ApiResponse,
  TOptions extends object,
>(config: CrudLoaderWithOptionsConfig<TRequest, TResponse, TOptions>):
  ({ params }: ClientLoaderFunctionArgs) => Promise<CrudLoaderResultWithOptions<
    TRequest,
    TOptions
  >>;
export function createClientLoader<TRequest, TResponse extends ApiResponse>(
  config: CrudLoaderConfig<TRequest, TResponse>,
): ({ params }: ClientLoaderFunctionArgs) => Promise<CrudLoaderResult<TRequest>>;
export function createClientLoader<
  TRequest,
  TResponse extends ApiResponse,
  TOptions extends object,
>({
  getRecord,
  emptyFormValues,
  options: optionsConfig,
}: CrudLoaderConfig<TRequest, TResponse> & {
  options?: CrudLoaderOptions<TOptions>;
}) {
  return async function clientLoader({ params }: ClientLoaderFunctionArgs) {
    const { operation, id } = validateCrudRouteParams(params);

    const isCreateOp = operation === crudOps.create;
    const isDuplicateOp = operation === crudOps.create && !Number.isNaN(id);
    const isUpdateOp = operation === crudOps.update;

    const needsOptionsEndpoint = !!optionsConfig && (isCreateOp || isUpdateOp);
    const optionsParam = isDuplicateOp || isUpdateOp ? { recordId: id } : undefined;
    const [recordResponse, optionsResponse] = await Promise.all([
      !Number.isNaN(id) ? getRecord(id) : null,
      needsOptionsEndpoint ? optionsConfig!.getOptions(optionsParam) : null,
    ]);

    let initialFormValues: TRequest = emptyFormValues;
    let recordOptions = null;
    let loaderError: string | null = null;

    if (recordResponse && recordResponse.status !== 200) {
      loaderError = getErrorMessage(recordResponse.data, recordResponse.status);
    } else if (recordResponse) {
      recordOptions = (recordResponse.data as { recordOptions?: TOptions }).recordOptions;
      initialFormValues = recordResponse.data as TRequest;
    }

    if (!loaderError && optionsResponse && optionsResponse.status !== 200) {
      loaderError = getErrorMessage(optionsResponse.data, optionsResponse.status);
    }

    if (!optionsConfig) {
      return { operation, initialFormValues, loaderError };
    }

    if (optionsResponse?.status !== 200) {
      const options = recordOptions ?? optionsConfig.emptyOptions;
      return { operation, initialFormValues, options, loaderError };
    } else {
      const options = optionsResponse.data as TOptions;
      return { operation, initialFormValues, options, loaderError };
    }
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
      create: { sendRequest: (req: TRequest) => createRecord(req), successCode: 201 },
      update: { sendRequest: (req: TRequest) => updateRecord(id, req), successCode: 200 },
      delete: { sendRequest: () => deleteRecord(id), successCode: 204 },
      view: { sendRequest: () => { throw OperationCanceledException }, successCode: NaN },
    }

    const apiRequest = await request.json() as TRequest;
    Object.assign(apiRequest, { updatedBy: "user" });
    const response = await requestedOp[operation].sendRequest(apiRequest);

    if (requestedOp[operation].successCode === response.status) {
      showToast("Success");
      return redirect(listRouteUrl);
    }

    return { actionError: getErrorMessage(response.data, response.status) };
  };
}
