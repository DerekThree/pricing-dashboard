import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";

import { ApiError, deleteApi, getApi, postApi, putApi } from "./apiUtils";

const validActions = new Set(["create", "view", "update", "delete"]);

export type FormValues<TFields extends readonly string[]> = {
  [TField in TFields[number]]: string;
};

type CrudRouteHandlersConfig<TFields extends readonly string[]> = {
  fields: TFields;
  apiUrl: string;
  listRouteUrl: string;
};

function validateRouteParams(params: LoaderFunctionArgs["params"]) {
  if (!params.action || !validActions.has(params.action)) {
    throw new Response(
      `The requested page could not be found: ${params.action} is not supported`,
      { status: 404 },
    );
  }

  if (params.action !== "create" && (!params.id || !/^\d+$/.test(params.id))) {
    throw new Response(
      "The requested page could not be found. Missing or invalid record id",
      { status: 404 },
    );
  }

  return {
    action: params.action,
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

export function createCrudRouteHandlers<const TFields extends readonly string[]>({
  fields,
  apiUrl,
  listRouteUrl,
}: CrudRouteHandlersConfig<TFields>) {
  const emptyRecord = Object.fromEntries(
    fields.map((field) => [field, ""])
  ) as FormValues<typeof fields>;

  async function loader({ params }: LoaderFunctionArgs) {
    const { action, id } = validateRouteParams(params);

    if (action === "create") {
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
  }

  async function action({ request, params }: ActionFunctionArgs) {
    const { action: recordAction, id } = validateRouteParams(params);

    if (recordAction === "create" || recordAction === "update") {
      const formData = await request.formData();
      const submittedValues = getSubmittedFormValues(formData, fields);

      if (recordAction === "create") {
        await postApi(apiUrl, submittedValues);
      } else {
        await putApi(`${apiUrl}/${id}`, submittedValues);
      }
    } else if (recordAction === "delete") {
      await deleteApi(`${apiUrl}/${id}`);
    }

    return redirect(listRouteUrl);
  }

  return { action, loader };
}
