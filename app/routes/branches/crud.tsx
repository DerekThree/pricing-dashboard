import "./styles.css";

import { Form, useLoaderData, useParams } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import {
  createCrudRouteHandlers,
  type FormValues,
} from "../../utils/crudRouteUtils";

const branchFields = [
  "branchCode",
  "branchName",
  "state",
  "zipCode",
] as const;

type BranchFormValues = FormValues<typeof branchFields>;

const routeHandlers = createCrudRouteHandlers({
  fields: branchFields,
  apiUrl: "/branches",
  listRouteUrl: "/branches",
});

export const action = routeHandlers.action;
export const loader = routeHandlers.loader;

export default function Crud() {
  const { action } = useParams();
  const { record, loaderError } = useLoaderData<typeof loader>();
  const inputsDisabled = !!loaderError || action === "view" || action === "delete";
  const { formValues, updateField } = useFormValues<BranchFormValues>(record);

  return (
    <section className="page">
        <Form method="post">
          <CrudPageTopMenu
            action={action}
            entityTitle="Branch"
            listRouteUrl="/branches"
            loaderError={loaderError}
          />
          {loaderError && <p className="crud-loader-error">{loaderError}</p>}
          <div className="crud-form-column">
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
                onChange={(event) =>
                  updateField("branchName", event.target.value)
                }
              />
            </label>
            <label
              className="crud-form-field branch-form-field--state"
              htmlFor="state"
            >
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
            <label
              className="crud-form-field branch-form-field--zip"
              htmlFor="zip-code"
            >
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
          </div>
        </Form>
    </section>
  );
}
