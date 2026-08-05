import "./styles.css";

import {
  AllCommunityModule,
  type GridApi,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
  type SelectionChangedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useRef, useState } from "react";
import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

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
import { type PricingPlanDetail } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit, toDropdownOption } from "../../utils/formUtils";
import { routeUrls } from "../../routes";
import EditableListField from "~/app/components/EditableListField";

ModuleRegistry.registerModules([AllCommunityModule]);

type FeeRow = {
  name: string;
};

type RateRow = {
  id: string;
  name: string;
  isAddRow?: boolean;
};

const depositFeeRows: FeeRow[] = [
  { name: "Monthly" },
  { name: "Annual" },
  { name: "Overdraft" },
  { name: "Extended Overdraft" },
  { name: "Returned Payment" },
  { name: "ATM" },
  { name: "Foreign ATM" },
  { name: "Foreign Transaction" },
  { name: "Wire" },
  { name: "Inactivity" },
];

const creditFeeRows: FeeRow[] = [
  { name: "Origination" },
  { name: "Processing" },
  { name: "Late Payment" },
  { name: "Returned Payment" },
];

function toFormValues(record: PricingPlanDetail) {
  return {
    planCode: record.planCode,
    planName: record.planName,
    productId: record.product.id,
    regionId: record.region.id,
    activeFrom: record.activeFrom,
    activeThrough: record.activeThrough,
  };
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  const emptyFormValues = {
    planCode: "",
    planName: "",
    productId: NaN,
    regionId: NaN,
    activeFrom: "",
    activeThrough: "",
  };
  const needsRecord = operation !== crudOps.create;
  const needsOptionsEndpoint = operation === crudOps.create || operation === crudOps.update;
  const [recordResponse, optionsResponse] = await Promise.all([
    needsRecord ? getPricingPlan(id) : null,
    needsOptionsEndpoint ? getPricingPlanOptions() : null,
  ]);

  if (recordResponse && recordResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      loaderError: getErrorMessage(recordResponse.data, recordResponse.status),
    };
  }

  if (optionsResponse && optionsResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      loaderError: getErrorMessage(optionsResponse.data, optionsResponse.status),
    };
  }

  const initialFormValues = recordResponse?.data ? toFormValues(recordResponse.data) : emptyFormValues;
  const options = optionsResponse?.data ?? {
    fees: [],
    products: [recordResponse!.data.product],
    regions: [recordResponse!.data.region],
  };

  return { operation, initialFormValues, options, loaderError: null };
}

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
  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;
  const selectedProduct = options?.products.find((product) => product.id === formValues.productId);

  return (
    <section className="page">
      <Form method="post" onKeyDown={preventEnterSubmit}>
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
            <label className="crud-page-form-field" htmlFor="plan-code">
              <span>Plan Code</span>
              <input
                disabled={inputsDisabled}
                id="plan-code"
                maxLength={8}
                name="planCode"
                pattern="[A-Z0-9]{8}"
                title="Plan code must be exactly 8 uppercase letters or digits."
                required
                type="text"
                value={formValues.planCode}
                onChange={(event) =>
                  updateField("planCode", event.target.value.toUpperCase())
                }
              />
            </label>
            <label className="crud-page-form-field" htmlFor="plan-name">
              <span>Plan Name</span>
              <input
                disabled={inputsDisabled}
                id="plan-name"
                maxLength={100}
                name="planName"
                required
                title={formValues.planName}
                type="text"
                value={formValues.planName}
                onChange={(event) =>
                  updateField("planName", event.target.value)
                }
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <Dropdown
              disabled={inputsDisabled}
              label="Product"
              name="productId"
              required
              options={options?.products.map(toDropdownOption)}
              value={formValues.productId}
              onChange={(value) => updateField("productId", value)}
            />
            <Dropdown
              disabled={inputsDisabled}
              label="Region"
              name="regionId"
              required
              options={options?.regions.map(toDropdownOption)}
              value={formValues.regionId}
              onChange={(value) => updateField("regionId", value)}
            />
            <label className="crud-page-form-field" htmlFor="active-from">
              <span>Active From</span>
              <input
                disabled={inputsDisabled}
                id="active-from"
                name="activeFrom"
                required
                type="date"
                value={formValues.activeFrom}
                onChange={(event) =>
                  updateField("activeFrom", event.target.value)
                }
              />
            </label>
            <label className="crud-page-form-field" htmlFor="active-through">
              <span>Active Through</span>
              <input
                disabled={inputsDisabled}
                id="active-through"
                name="activeThrough"
                required
                type="date"
                value={formValues.activeThrough}
                onChange={(event) =>
                  updateField("activeThrough", event.target.value)
                }
              />
            </label>
          </div>
          {selectedProduct && (
            <div className="pricing-plan-side-column">
              <div className="crud-page-form-column">
                <EditableListField
                  columnDefs={[{ field: "name" }]}
                  disabled={inputsDisabled}
                  rowData={depositFeeRows}
                  title="Fees"
                  onAdd={() => ({ name: "new"})}
                  onRemove={() => {}}
                  onSelectionChanged={() => {}}
                />
              </div>
              <div className="crud-page-form-column">
                <EditableListField
                  columnDefs={[{ field: "name" }]}
                  disabled={inputsDisabled}
                  rowData={[]}
                  title="Rates"
                  onAdd={() => ({ name: "new"})}
                  onRemove={() => {}}
                  onSelectionChanged={() => {}}
                />
              </div>
            </div>
          )}
        </div>
      </Form>
    </section>
  );
}
