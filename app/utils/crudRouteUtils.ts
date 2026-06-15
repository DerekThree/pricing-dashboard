import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";

import { ApiError, deleteApi, getApi, postApi, putApi } from "./apiUtils";

const validOperations = new Set(["create", "view", "update", "delete"]);

export type FormValues<TFields extends readonly string[]> = {
  [TField in TFields[number]]: string;
};

type CrudRouteConfig<TFields extends readonly string[]> = {
  fields: TFields;
  apiUrl: string;
  listRouteUrl: string;
};

function validateRouteParams(params: LoaderFunctionArgs["params"]) {
  if (!params.operation || !validOperations.has(params.operation)) {
    throw new Response(
      `The requested page could not be found: ${params.operation} is not supported`,
      { status: 404 },
    );
  }

  if (
    params.operation !== "create" &&
    (!params.id || !/^\d+$/.test(params.id))
  ) {
    throw new Response(
      "The requested page could not be found. Missing or invalid record id",
      { status: 404 },
    );
  }

  return {
    operation: params.operation,
    id: params.id,
  };
}

function getSubmittedFormValues<TFields extends readonly string[]>(
  formData: FormData,
  fields: TFields,
): FormValues<TFields> {
  return Object.fromEntries(
    fields.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as FormValues<TFields>;
}

export function createRouteLoader<const TFields extends readonly string[]>({
  fields,
  apiUrl,
}: CrudRouteConfig<TFields>) {
  const emptyRecord = Object.fromEntries(
    fields.map((field) => [field, ""]),
  ) as FormValues<typeof fields>;

  return async function loader({ params }: LoaderFunctionArgs) {
    const { operation, id } = validateRouteParams(params);

    if (operation === "create") {
      return { record: emptyRecord, loaderError: null };
    }

    try {
      const record = await getApi<FormValues<TFields>>(`${apiUrl}/${id}`);

      return { record, loaderError: null };
    } catch (error) {
      if (error instanceof ApiError) {
        return { record: emptyRecord, loaderError: error.message };
      }

      throw error;
    }
  };
}

export function createRouteAction<const TFields extends readonly string[]>({
  fields,
  apiUrl,
  listRouteUrl,
}: CrudRouteConfig<TFields>) {
  return async function action({ request, params }: ActionFunctionArgs) {
    const { operation, id } = validateRouteParams(params);

    if (operation === "create" || operation === "update") {
      const formData = await request.formData();
      const submittedValues = getSubmittedFormValues(formData, fields);

      if (operation === "create") {
        await postApi(apiUrl, submittedValues);
      } else {
        await putApi(`${apiUrl}/${id}`, submittedValues);
      }
    } else if (operation === "delete") {
      await deleteApi(`${apiUrl}/${id}`);
    }

    return redirect(listRouteUrl);
  };
}
