import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createBranch, deleteBranch, getBranch, updateBranch } from "../../generated/api/client";
import type { BranchRequest } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps } from "../../utils/crudRouteUtils";
import { preventTextInputSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

const emptyBranchRequest: BranchRequest = {
  branchCode: "",
  branchName: "",
  state: "",
  zipCode: "",
  updatedBy: "",
};

export const clientLoader = createClientLoader({
  getRecord: getBranch,
  emptyRequest: emptyBranchRequest,
});

export const clientAction = createClientAction({
  createRecord: createBranch,
  updateRecord: updateBranch,
  deleteRecord: deleteBranch,
  listRouteUrl: routeUrls.branches,
});

export default function BranchPage() {
  const { operation, record, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(record);
  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  return (
    <section className="page">
      <Form method="post" onKeyDown={preventTextInputSubmit}>
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Branch"
          listRouteUrl={routeUrls.branches}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <input name="updatedBy" type="hidden" value={formValues.updatedBy} />
        <div className="form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field branch-form-field--code" htmlFor="branch-code">
              <span>Branch Code</span>
              <input
                disabled={inputsDisabled}
                id="branch-code"
                maxLength={8}
                name="branchCode"
                pattern="[0-9]{8}"
                required
                type="text"
                value={formValues.branchCode}
                onChange={(event) => updateField("branchCode", event.target.value.toUpperCase())}
              />
            </label>
            <label
              className="crud-page-form-field crud-page-form-field--tooltip"
              data-tooltip={formValues.branchName}
              htmlFor="branch-name"
            >
              <span>Branch Name</span>
              <input
                disabled={inputsDisabled}
                id="branch-name"
                maxLength={100}
                name="branchName"
                required
                type="text"
                value={formValues.branchName}
                onChange={(event) => updateField("branchName", event.target.value)}
              />
            </label>
            <label className="crud-page-form-field branch-form-field--state" htmlFor="state">
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
                    event.target.value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2),
                  )
                }
              />
            </label>
            <label className="crud-page-form-field branch-form-field--zip" htmlFor="zip-code">
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
                  updateField("zipCode", event.target.value.replace(/\D/g, "").slice(0, 5))
                }
              />
            </label>
          </div>
        </div>
      </Form>
    </section>
  );
}
