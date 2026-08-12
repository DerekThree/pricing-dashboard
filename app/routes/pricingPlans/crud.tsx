import "./styles.css";

import { useCallback, useRef, useState, type FormEvent } from "react";
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
  getPricingPlanSecondaryOptions,
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
};

type PricingPlanSecondaryOptions = PricingPlanOptions & Required<Pick<PricingPlanOptions,
  "productId" | "regionId" | "fees" | "reasons" | "intervals"
>>;

type PricingPlanRecordOptions = PricingPlanOptions & Required<Pick<PricingPlanOptions,
  "fees" | "reasons"
>>;

function isPricingPlanSecondaryOptions(
  options: PricingPlanOptions,
): options is PricingPlanSecondaryOptions {
  return options.productId !== undefined && options.regionId !== undefined &&
    options.fees !== undefined && options.reasons !== undefined && options.intervals !== undefined;
}

function matchesSelectedContext(
  options: PricingPlanSecondaryOptions,
  productId: number,
  regionId: number,
) {
  return options.productId === productId && options.regionId === regionId;
}

function isPricingPlanRecordOptions(
  options: PricingPlanOptions,
): options is PricingPlanRecordOptions {
  return options.fees !== undefined && options.reasons !== undefined;
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
  const selectedContext = useRef({
    productId: formValues.productId,
    regionId: formValues.regionId,
  });
  selectedContext.current = {
    productId: formValues.productId,
    regionId: formValues.regionId,
  };
  const [secondaryOptions, setSecondaryOptions] = useState<PricingPlanSecondaryOptions | null>(() =>
    isPricingPlanSecondaryOptions(options) &&
    matchesSelectedContext(options, formValues.productId, formValues.regionId)
      ? options
      : null,
  );
  const [secondaryError, setSecondaryError] = useState<string | null>(null);

  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;
  const contextualInputsDisabled = inputsDisabled || !secondaryOptions;
  const recordOptions = inputsDisabled && isPricingPlanRecordOptions(options) ? options : null;
  const displayedOptions = secondaryOptions ?? recordOptions;

  const loadSecondaryOptions = useCallback(async (productId: number, regionId: number) => {
    setSecondaryOptions(null);
    setSecondaryError(null);
    if (Number.isNaN(productId) || Number.isNaN(regionId)) {
      return;
    }

    const response = await getPricingPlanSecondaryOptions({ productId, regionId });
    const { productId: currentProductId, regionId: currentRegionId } = selectedContext.current;
    if (response.status !== 200) {
      if (productId === currentProductId && regionId === currentRegionId) {
        setSecondaryError(getErrorMessage(response.data, response.status));
      }
      return;
    }

    if (isPricingPlanSecondaryOptions(response.data) &&
      matchesSelectedContext(response.data, currentProductId, currentRegionId)) {
      setSecondaryOptions(response.data);
    }
  }, []);

  function selectContext(productId: number, regionId: number) {
    selectedContext.current = { productId, regionId };
    updateField("productId", productId);
    updateField("regionId", regionId);
    updateField("activeFrom", "");
    updateField("activeThrough", "");
    void loadSecondaryOptions(productId, regionId);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((operation === crudOps.create || operation === crudOps.update) && !secondaryOptions) {
      return;
    }
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
        {secondaryError && <p className="page-error">{secondaryError}</p>}
        <div className="form-grid">
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
              onChange={(value) => selectContext(Number(value), formValues.regionId)}
            />
            <Dropdown
              label="Region"
              value={formValues.regionId}
              disabled={inputsDisabled}
              required
              options={options.regions.map(toDropdownOption)}
              onChange={(value) => selectContext(formValues.productId, Number(value))}
            />
            <label className="crud-page-form-field">
              <span>Active From</span>
              <input
                type="date"
                value={formValues.activeFrom}
                disabled={contextualInputsDisabled}
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
                disabled={contextualInputsDisabled}
                required
                onChange={(event) =>
                  updateField("activeThrough", event.target.value)
                }
              />
            </label>
          </div>
            <PricingPlanFeeEditor
              rows={formValues.fees}
              productId={formValues.productId}
              feeOptions={displayedOptions?.fees}
              reasonOptions={displayedOptions?.reasons}
              disabled={contextualInputsDisabled}
              onChange={(fees) => updateField("fees", fees)}
            />
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
        </div>
      </form>
    </section>
  );
}
