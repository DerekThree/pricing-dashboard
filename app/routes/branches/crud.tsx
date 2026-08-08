import "./styles.css";

import { type FormEvent } from "react";
import { useActionData, useLoaderData, useSubmit, type SubmitTarget } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createBranch, deleteBranch, getBranch, updateBranch } from "../../generated/api/client";
import { createClientAction, createClientLoader, crudOps } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";
import type { BranchRequest } from "~/app/generated/api/models";

const emptyFormValues: BranchRequest = {
  branchCode: "",
  branchName: "",
  state: "",
  zipCode: "",
  updatedBy: "",
};

export const clientLoader = createClientLoader({
  getRecord: getBranch,
  emptyFormValues,
});

export const clientAction = createClientAction({
  createRecord: createBranch,
  updateRecord: updateBranch,
  deleteRecord: deleteBranch,
  listRouteUrl: routeUrls.branches,
});

export default function BranchPage() {
  const { operation, initialFormValues, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
  const submit = useSubmit();

  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(
      { ...formValues, branchCode: formValues.branchCode.toUpperCase() } as unknown as SubmitTarget,
      { method: "post", encType: "application/json" },
    );
  }

  return (
    <section className="page">
      <form onKeyDown={preventEnterSubmit} onSubmit={handleSubmit}>
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Branch"
          listRouteUrl={routeUrls.branches}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <div className="form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field branch-form-field--code">
              <span>Branch Code</span>
              <input
                title="Branch code must be 1 to 25 letters or digits."
                type="text"
                value={formValues.branchCode}
                disabled={inputsDisabled}
                maxLength={25}
                pattern="[A-Za-z0-9]{1,25}"
                required
                onChange={(event) => updateField("branchCode", event.target.value)}
              />
            </label>
            <label className="crud-page-form-field">
              <span>Branch Name</span>
              <input
                title={formValues.branchName}
                type="text"
                value={formValues.branchName}
                disabled={inputsDisabled}
                maxLength={100}
                required
                onChange={(event) => updateField("branchName", event.target.value)}
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <label className="crud-page-form-field branch-form-field--state">
              <span>State</span>
              <input
                type="text"
                value={formValues.state}
                disabled={inputsDisabled}
                maxLength={2}
                pattern="[A-Z]{2}"
                required
                onChange={(event) =>
                  updateField(
                    "state",
                    event.target.value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2),
                  )
                }
              />
            </label>
            <label className="crud-page-form-field branch-form-field--zip">
              <span>Zip Code</span>
              <input
                type="text"
                value={formValues.zipCode}
                disabled={inputsDisabled}
                maxLength={5}
                pattern="[0-9]{5}"
                inputMode="numeric"
                required
                onChange={(event) =>
                  updateField("zipCode", event.target.value.replace(/\D/g, "").slice(0, 5))
                }
              />
            </label>
          </div>
        </div>
      </form>
    </section>
  );
}
