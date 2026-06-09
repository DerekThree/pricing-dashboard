import "./styles.css";

import { useState, type FormEvent } from "react";
import {
  isRouteErrorResponse,
  useLoaderData,
  useNavigate,
  useParams,
  useRouteError,
  type LoaderFunctionArgs,
} from "react-router";

import PageTopMenu from "../../components/PageTopMenu";
import { ApiError, getApi, postApi, putApi, deleteApi } from "../../utils/apiUtils";
import Layout from "../layout";

type BranchDetails = {
  id: number;
  branchCode: string;
  branchName: string;
  state: string;
  zipCode: string;
};

type BranchFormValues = Omit<BranchDetails, "id">;
type BranchAction = "create" | "view" | "update" | "delete";

const validActions = new Set<BranchAction>([
  "create",
  "view",
  "update",
  "delete",
]);

function formatAction(action: string | undefined) {
  return action
    ? action.charAt(0).toUpperCase() + action.slice(1)
    : "Unknown";
}

function getInitialFormValues(branch: BranchDetails | null): BranchFormValues {
  return {
    branchCode: branch?.branchCode ?? "",
    branchName: branch?.branchName ?? "",
    state: branch?.state ?? "",
    zipCode: branch?.zipCode ?? "",
  };
}

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.action || !validActions.has(params.action as BranchAction)) {
    throw new Response("Invalid branch action", { status: 404 });
  }

  if (params.action === "create") {
    return null;
  }

  if (!params.id) {
    throw new Response("Missing branch id", { status: 400 });
  }

  try {
    return await getApi<BranchDetails>(`/branches/${params.id}`);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Response(error.message, { status: error.status });
    }

    throw error;
  }
}

export default function Crud() {
  const navigate = useNavigate();
  const { action } = useParams();
  const branch = useLoaderData<typeof loader>();
  const inputsDisabled =
    action === "view" || action === "delete";
  const [formValues, setFormValues] = useState(() =>
    getInitialFormValues(branch),
  );

  function updateField(field: keyof BranchFormValues, value: string) {
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

  // TODO: convert this to function action for router to use
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (action === "create") {
      await postApi("/branches", formValues);
    } else if (action === "update" && branch) {
      await putApi(`/branches/${branch.id}`, formValues);
    } else if (action === "delete" && branch) {
      await deleteApi(`/branches/${branch.id}`);
    }

    navigate("/branches");
  }

  return (
    <Layout>
      <section className="page">
        <PageTopMenu
          title={`${formatAction(action)} Branch`}
          action={action}
          onAction={onAction}
        />
        <form
          className="crud-form-column"
          id="branch-crud-form"
          onSubmit={onSubmit}
        >
          <label className="crud-form-field" htmlFor="branch-code">
            <span>Branch Code</span>
            <input
              disabled={inputsDisabled}
              id="branch-code"
              name="branch-code"
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
              name="branch-name"
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
              name="zip-code"
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
        </form>
      </section>
    </Layout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const description = isRouteErrorResponse(error)
    ? error.status === 404
      ? "That branch page could not be found."
      : error.status === 400
        ? "That branch request is missing information."
        : "Something went wrong while opening this branch page."
    : "Something went wrong while opening this branch page.";

  return (
    <Layout>
      <section className="page">
        <PageTopMenu title="Branch" />
        <p>{description}</p>
      </section>
    </Layout>
  );
}
