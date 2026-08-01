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
  getProductRegionOptions,
  updatePricingPlan,
} from "../../generated/api/client";
import type { ProductRegionOptions } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";
import SelectionList from "~/app/components/SelectionList";

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
  const emptyDropdownOptions: ProductRegionOptions = {
    products: [],
    regions: [],
  };

  const needsRecord = operation !== crudOps.create;
  const needsOptionsEndpoint = operation === crudOps.create || operation === crudOps.update;
  const [recordResponse, optionsResponse] = await Promise.all([
    needsRecord ? getPricingPlan(id) : null,
    needsOptionsEndpoint ? getProductRegionOptions() : null,
  ]);

  if (recordResponse && recordResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      dropdownOptions: emptyDropdownOptions,
      loaderError: getErrorMessage(recordResponse.data, recordResponse.status),
    };
  }

  if (optionsResponse && optionsResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      dropdownOptions: emptyDropdownOptions,
      loaderError: getErrorMessage(optionsResponse.data, optionsResponse.status),
    };
  }

  const initialFormValues = recordResponse?.data ?? emptyFormValues;
  const dropdownOptions = optionsResponse?.data ?? recordResponse?.data.formOptions ?? emptyDropdownOptions;

  return { operation, initialFormValues, dropdownOptions, loaderError: null };
}

export const clientAction = createClientAction({
  createRecord: createPricingPlan,
  updateRecord: updatePricingPlan,
  deleteRecord: deletePricingPlan,
  listRouteUrl: routeUrls.pricingPlans,
});

export default function PricingPlanPage() {
  const { operation, initialFormValues, dropdownOptions, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
  const [rateRows, setRateRows] = useState<RateRow[]>([]);
  const feesGridApiRef = useRef<GridApi<FeeRow> | null>(null);
  const ratesGridApiRef = useRef<GridApi<RateRow> | null>(null);
  const pendingSelectedRateIdRef = useRef("");
  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;
  const selectedProduct = dropdownOptions.products.find((product) => product.id === formValues.productId);
  const feeRows = selectedProduct ? [...depositFeeRows, ...creditFeeRows] : [];
  const displayedRateRows = [...rateRows, { id: "add-rate", name: "Add rate", isAddRow: true }];
  const ratesColumnDefs: ColDef<RateRow>[] = [
    { field: "name", headerName: "Rate" },
    {
      cellRenderer: (params: ICellRendererParams<RateRow>) =>
        params.data?.isAddRow ? null : (
          <button
            className="pricing-plan-table-remove"
            disabled={inputsDisabled}
            type="button"
            onClick={() => setRateRows((currentRows) => currentRows.filter((row) => row.id !== params.data?.id))}
          >
            X
          </button>
        ),
      colId: "remove",
      maxWidth: 32,
      minWidth: 32,
      resizable: false,
      sortable: false,
      width: 32,
    },
  ];

  function handleFeesSelectionChanged(event: SelectionChangedEvent<FeeRow>) {
    const selectedRow = event.api.getSelectedRows()[0];

    if (!selectedRow) {
      return;
    }

    ratesGridApiRef.current?.deselectAll();
  }

  function handleRatesSelectionChanged(event: SelectionChangedEvent<RateRow>) {
    const selectedRow = event.api.getSelectedRows()[0];

    if (selectedRow) {
      feesGridApiRef.current?.deselectAll();
    }

    if (!selectedRow?.isAddRow) {
      return;
    }

    const newRow = { id: `rate-${rateRows.length + 1}`, name: `Rate ${rateRows.length + 1}` };
    pendingSelectedRateIdRef.current = newRow.id;
    setRateRows((currentRows) => [...currentRows, newRow]);
  }

  function handleRatesRowDataUpdated() {
    if (!pendingSelectedRateIdRef.current || !ratesGridApiRef.current) {
      return;
    }

    ratesGridApiRef.current.forEachNode((node) => {
      node.setSelected(node.data?.id === pendingSelectedRateIdRef.current);
    });
    pendingSelectedRateIdRef.current = "";
  }

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
              options={dropdownOptions.products.map((product) => ({
                value: product.id,
                label: product.name,
                description: product.code,
              }))}
              value={formValues.productId}
              onChange={(value) => updateField("productId", value)}
            />
            <Dropdown
              disabled={inputsDisabled}
              label="Region"
              name="regionId"
              required
              options={dropdownOptions.regions.map((region) => ({
                value: region.id,
                label: region.name,
                description: region.code,
              }))}
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
                <SelectionList
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
                <SelectionList
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
