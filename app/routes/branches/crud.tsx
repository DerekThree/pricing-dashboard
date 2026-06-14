import "./styles.css";

import { useState } from "react";
import {
  Form,
  redirect,
  useLoaderData,
  useNavigate,
  useParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";

import PageTopMenu from "../../components/PageTopMenu";
import { ApiError, getApi, postApi, putApi, deleteApi } from "../../utils/apiUtils";
import Layout from "../layout";

type RecordFormValues = {
  branchCode: string;
  branchName: string;
  state: string;
  zipCode: string;
};

type LoaderData = {
  record: RecordFormValues;
  loaderError: string | null;
};

const emptyRecord: RecordFormValues = {
  branchCode: "",
  branchName: "",
  state: "",
  zipCode: "",
};

const validActions = new Set([
  "create",
  "view",
  "update",
  "delete",
]);

function validateRouteParams(params: LoaderFunctionArgs["params"]) {
  if (!params.action || !validActions.has(params.action)) {
    throw new Response(`The requested page could not be found: ${params.action} is not supported`, {
      status: 404,
    });
  }

  if (params.action !== "create" && (!params.id || !/^\d+$/.test(params.id))) {
    throw new Response("The requested page could not be found. Missing or invalid record id", {
      status: 404,
    });
  }

  return {
    action: params.action,
    id: params.id,
  };
}

function formatAction(action: string | undefined) {
  return action
    ? action.charAt(0).toUpperCase() + action.slice(1)
    : "Unknown";
}

function getSubmittedFormValues(formData: FormData): RecordFormValues {
  return {
    branchCode: String(formData.get("branchCode") ?? ""),
    branchName: String(formData.get("branchName") ?? ""),
    state: String(formData.get("state") ?? ""),
    zipCode: String(formData.get("zipCode") ?? ""),
  };
}

export async function loader({
  params,
}: LoaderFunctionArgs): Promise<LoaderData> {
  const { action, id } = validateRouteParams(params);

  if (action === "create") {
    return { record: emptyRecord, loaderError: null };
  }

  try {
    const record = await getApi<RecordFormValues>(`/branches/${id}`);

    return { record, loaderError: null };
  } catch (error) {
    if (error instanceof ApiError) {
      return { record: emptyRecord, loaderError: error.message };
    }

    throw error;
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { action: recordAction, id } = validateRouteParams(params);
  const formData = await request.formData();
  const submittedValues = getSubmittedFormValues(formData);

  if (recordAction === "create") {
    await postApi("/branches", submittedValues);
  } else {
    if (recordAction === "update") {
      await putApi(`/branches/${id}`, submittedValues);
    } else if (recordAction === "delete") {
      await deleteApi(`/branches/${id}`);
    }
  }

  return redirect("/branches");
}

export default function Crud() {
  const navigate = useNavigate();
  const { action } = useParams();
  const { record, loaderError } = useLoaderData<typeof loader>();
  const inputsDisabled = !!loaderError || action === "view" || action === "delete";
  const shouldShowDone = !!loaderError || action === "view";
  const [formValues, setFormValues] = useState(record);
  const doneAction = {
    label: "Done",
    onClick: () => navigate("/branches"),
  };
  const submitAction = {
    label: formatAction(action),
    onClick: onAction,
  };
  const cancelAction = {
    label: "Cancel",
    onClick: () => navigate("/branches"),
    variant: "cancel" as const,
  };

  function updateField(field: keyof RecordFormValues, value: string) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function onAction() {
    const form = document.getElementById("branch-crud-form");

    if (form instanceof HTMLFormElement) {
      form.requestSubmit();
    }
  }

  return (
    <Layout>
      <section className="page">
        <PageTopMenu
          title={`${formatAction(action)} Branch`}
          actions={shouldShowDone ? [doneAction] : [submitAction, cancelAction]}
        />
        {loaderError && <p className="crud-loader-error">{loaderError}</p>}
        <Form
          className="crud-form-column"
          id="branch-crud-form"
          method="post"
        >
          <label className="crud-form-field" htmlFor="branch-code">
            <span>Branch Code</span>
            <input
              disabled={inputsDisabled}
              id="branch-code"
              name="branchCode"
              required
              type="text"
              value={formValues.branchCode}
              onChange={(event) =>
                updateField("branchCode", event.target.value.toUpperCase())
              }
            />
          </label>
          <label className="crud-form-field" htmlFor="branch-name">
            <span>Branch Name</span>
            <input
              disabled={inputsDisabled}
              id="branch-name"
              name="branchName"
              required
              type="text"
              value={formValues.branchName}
              onChange={(event) => updateField("branchName", event.target.value)}
            />
          </label>
          <label className="crud-form-field crud-form-field--state" htmlFor="state">
            <span>State</span>
            <input
              disabled={inputsDisabled}
              id="state"
              maxLength={2}
              name="state"
              pattern="[A-Z]{2}"
              required
              type="text"
              value={formValues.state}
              onChange={(event) =>
                updateField(
                  "state",
                  event.target.value
                    .replace(/[^a-z]/gi, "")
                    .toUpperCase()
                    .slice(0, 2),
                )
              }
            />
          </label>
          <label className="crud-form-field crud-form-field--zip" htmlFor="zip-code">
            <span>Zip Code</span>
            <input
              disabled={inputsDisabled}
              id="zip-code"
              inputMode="numeric"
              maxLength={5}
              name="zipCode"
              pattern="[0-9]{5}"
              required
              type="text"
              value={formValues.zipCode}
              onChange={(event) =>
                updateField(
                  "zipCode",
                  event.target.value.replace(/\D/g, "").slice(0, 5),
                )
              }
            />
          </label>
        </Form>
      </section>
    </Layout>
  );
}
