import "./styles.css";

import { type FormEvent } from "react";
import {
  useActionData,
  useLoaderData,
  useSubmit,
  type ClientLoaderFunctionArgs,
  type SubmitTarget as JsonValue,
} from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import {
  createPricingPlan,
  deletePricingPlan,
  getPricingPlan,
  getPricingPlanOptions,
  updatePricingPlan,
} from "../../generated/api/client";
import {
  type PricingPlanDetail,
  type PricingPlanRequest,
  type PricingPlanFeeRequest,
  type PricingPlanOptions,
} from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, createClientLoader, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit, toDropdownOption } from "../../utils/formUtils";
import { routeUrls } from "../../routes";
import PricingPlanFeeEditor from "./PricingPlanFeeEditor";
import EditableListField from "~/app/components/EditableListField";

const emptyFormValues: PricingPlanRequest = {
  planCode: "",
  planName: "",
  productId: NaN,
  regionId: NaN,
  activeFrom: "",
  activeThrough: "",
  fees: [],
  updatedBy: "",
};

const emptyOptions: PricingPlanOptions = {
  products: [],
  regions: [],
  fees: [],
  reasons: [],
}

export const clientLoader = createClientLoader({
  getRecord: getPricingPlan,
  emptyFormValues,
  options: {
    getOptions: getPricingPlanOptions,
    emptyOptions,
  }
})

export const clientAction = createClientAction({
  createRecord: createPricingPlan,
  updateRecord: updatePricingPlan,
  deleteRecord: deletePricingPlan,
  listRouteUrl: routeUrls.pricingPlans,
});

export default function PricingPlanPage() {
  const { operation, initialFormValues, options, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
  const submit = useSubmit();

  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  const selectedProduct = options.products.find((product) => product.id === formValues.productId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(
      { ...formValues, planCode: formValues.planCode.toUpperCase() } as unknown as JsonValue,
      { method: "post", encType: "application/json" },
    );
  }

  return (
    <section className="page">
      <form onKeyDown={preventEnterSubmit} onSubmit={handleSubmit}>
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Pricing Plan"
          listRouteUrl={routeUrls.pricingPlans}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <div className={`form-grid ${selectedProduct ? "pricing-plan-form-grid" : ""}`}>
          <div className="crud-page-form-column">
            <label className="crud-page-form-field crud-page-form-field--code">
              <span>Plan Code</span>
              <input
                title="Plan code must be 1 to 25 letters or digits."
                type="text"
                value={formValues.planCode}
                disabled={inputsDisabled}
                maxLength={25}
                pattern="[A-Za-z0-9]{1,25}"
                required
                onChange={(event) => updateField("planCode", event.target.value)}
              />
            </label>
            <label className="crud-page-form-field">
              <span>Plan Name</span>
              <input
                title={formValues.planName}
                type="text"
                value={formValues.planName}
                disabled={inputsDisabled}
                maxLength={100}
                required
                onChange={(event) =>
                  updateField("planName", event.target.value)
                }
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <Dropdown
              label="Product"
              value={formValues.productId}
              disabled={inputsDisabled}
              required
              options={options.products.map(toDropdownOption)}
              onChange={(value) => updateField("productId", value)}
            />
            <Dropdown
              label="Region"
              value={formValues.regionId}
              disabled={inputsDisabled}
              required
              options={options.regions.map(toDropdownOption)}
              onChange={(value) => updateField("regionId", value)}
            />
            <label className="crud-page-form-field">
              <span>Active From</span>
              <input
                type="date"
                value={formValues.activeFrom}
                disabled={inputsDisabled}
                required
                onChange={(event) =>
                  updateField("activeFrom", event.target.value)
                }
              />
            </label>
            <label className="crud-page-form-field">
              <span>Active Through</span>
              <input
                type="date"
                value={formValues.activeThrough}
                disabled={inputsDisabled}
                required
                onChange={(event) =>
                  updateField("activeThrough", event.target.value)
                }
              />
            </label>
          </div>
          {selectedProduct && (
            <PricingPlanFeeEditor
              rows={formValues.fees}
              feeOptions={options.fees
                .filter((fee) => fee.productTypes.includes(selectedProduct.type))}
              reasonOptions={options.reasons}
              disabled={inputsDisabled}
              onChange={(fees) => updateField("fees", fees)}
            />
          )}
          {selectedProduct && (
            <div className="crud-page-form-column">
                <EditableListField
                  title="Rates"
                  columnDefs={[{ field: "name" }]}
                  rowData={[]}
                  disabled={inputsDisabled}
                  onAdd={() => ({ name: "new"})}
                  onRemove={() => {}}
                  onSelectionChanged={() => {}}
                />
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
