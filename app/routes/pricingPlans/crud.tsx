import "./styles.css";

import {
  AllCommunityModule,
  ModuleRegistry,
} from "ag-grid-community";
import { useState } from "react";
import { Form, useActionData, useLoaderData, type ClientLoaderFunctionArgs } from "react-router";

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
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit, toDropdownOption } from "../../utils/formUtils";
import { routeUrls } from "../../routes";
import EditableListField from "~/app/components/EditableListField";
import MultiSelectField from "~/app/components/MultiSelectField";

ModuleRegistry.registerModules([AllCommunityModule]);

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  const emptyFormValues: PricingPlanRequest = {
    planCode: "",
    planName: "",
    productId: NaN,
    regionId: NaN,
    activeFrom: "",
    activeThrough: "",
    fees: [] as PricingPlanFeeRequest[],
    updatedBy: "",
  };

  const needsRecord = operation !== crudOps.create;
  const needsOptionsEndpoint = operation === crudOps.create || operation === crudOps.update;
  const [recordResponse, optionsResponse] = await Promise.all([
    needsRecord ? getPricingPlan(id) : null,
    needsOptionsEndpoint ? getPricingPlanOptions() : null,
  ]);

  function toFormValues(record: PricingPlanDetail): PricingPlanRequest {
    return {
      ...record,
      productId: record.product.id,
      regionId: record.region.id,
      fees: record.fees.map((fee) => ({
        feeId: fee.fee.id,
        amount: fee.amount,
        reasons: fee.reasons.map((reason) => reason.id),
      })),
    };
  }

  if (recordResponse && recordResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      options: { fees: [], products: [], regions: [], reasons: [] } as PricingPlanOptions,
      loaderError: getErrorMessage(recordResponse.data, recordResponse.status),
    };
  }

  if (optionsResponse && optionsResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      options: { fees: [], products: [], regions: [], reasons: [] } as PricingPlanOptions,
      loaderError: getErrorMessage(optionsResponse.data, optionsResponse.status),
    };
  }

  const initialFormValues = recordResponse?.data ? toFormValues(recordResponse.data) : emptyFormValues;
  const options = optionsResponse?.data ?? {
    fees: recordResponse!.data.fees.map((fee) => fee.fee),
    products: [recordResponse!.data.product],
    regions: [recordResponse!.data.region],
    reasons: [],
  };

  return { operation, initialFormValues, options, loaderError: null };
}

export const clientAction = createClientAction({
  createRecord: createPricingPlan,
  updateRecord: updatePricingPlan,
  deleteRecord: deletePricingPlan,
  listRouteUrl: routeUrls.pricingPlans,
  mapFormDataToRequest: (formData) => ({
    ...Object.fromEntries(formData),
    planCode: String(formData.get("planCode")).toUpperCase(),
    fees: formData.getAll("fees").map((fee) => JSON.parse(String(fee))),
  }),
});

export default function PricingPlanPage() {
  const { operation, initialFormValues, options, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);

  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  const selectedProduct = options.products.find((product) => product.id === formValues.productId);
  const [selectedFee, setSelectedFee] = useState<PricingPlanFeeRequest | null>(null);
  const feeOptions = selectedProduct
    ? options.fees
        .filter((fee) => fee.productTypes.includes(selectedProduct.type))
        .map(toDropdownOption)
    : [];
  const reasonOptions = options.reasons.map(toDropdownOption);

  function addFee() {
    const newFee: PricingPlanFeeRequest = {
      feeId: NaN,
      amount: NaN,
      reasons: [],
    };

    updateField("fees", [...formValues.fees, newFee]);

    return newFee;
  }

  function removeFee(removedFee: PricingPlanFeeRequest) {
    updateField("fees", formValues.fees.filter((fee) => fee !== removedFee));
    setSelectedFee(selectedFee === removedFee ? null : selectedFee);
  }

  function updateSelectedFee(updatedFee: Partial<PricingPlanFeeRequest>) {
    Object.assign(selectedFee!, updatedFee);
    updateField("fees", [...formValues.fees]);
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
            <label className="crud-page-form-field crud-page-form-field--code" htmlFor="plan-code">
              <span>Plan Code</span>
              <input
                disabled={inputsDisabled}
                id="plan-code"
                maxLength={25}
                name="planCode"
                pattern="[A-Za-z0-9]{1,25}"
                title="Plan code must be 1 to 25 letters or digits."
                required
                type="text"
                value={formValues.planCode}
                onChange={(event) => updateField("planCode", event.target.value)}
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
              options={options.products.map(toDropdownOption)}
              value={formValues.productId}
              onChange={(value) => updateField("productId", value)}
            />
            <Dropdown
              disabled={inputsDisabled}
              label="Region"
              name="regionId"
              required
              options={options.regions.map(toDropdownOption)}
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
                  columnDefs={[{ field: "feeId", valueFormatter: (params) => {
                    const feeOption = feeOptions.find((option) => option.value === params.value);
                    return feeOption ? feeOption.label : "New Fee";
                  }}]}
                  hideButtons={inputsDisabled}
                  rowData={formValues.fees}
                  title="Fees"
                  onAdd={addFee}
                  onRemove={removeFee}
                  onSelectionChanged={(fee) => setSelectedFee(fee)}
                />
                {formValues.fees.map((fee, index) => (
                  <input key={index} name="fees" type="hidden" value={JSON.stringify(fee)} />
                ))}

                    <Dropdown
                      disabled={inputsDisabled || !selectedFee}
                      label="Fee Name"
                      placeholder={!selectedFee ? "No fee selected" : undefined}
                      options={feeOptions}
                      value={selectedFee?.feeId}
                      onChange={(feeId) => updateSelectedFee({ feeId })}
                    />
                    <label className="crud-page-form-field" htmlFor="pricing-plan-fee-amount">
                      <span>Fee Amount</span>
                      <input
                        disabled={inputsDisabled || !selectedFee}
                        id="pricing-plan-fee-amount"
                        type="number"
                        value={selectedFee?.amount || ""}
                        placeholder={!selectedFee ? "No fee selected" : undefined}
                        onChange={(event) =>
                          updateSelectedFee({
                            amount: event.target.value === "" ? NaN : Number(event.target.value),
                          })
                        }
                      />
                    </label>
                    <MultiSelectField
                      disabled={inputsDisabled || !selectedFee}
                      options={reasonOptions}
                      selectedValues={selectedFee?.reasons ?? []}
                      title="Reasons to waive"
                      onAdd={(reasonId) =>
                        updateSelectedFee({
                          reasons: [...selectedFee!.reasons, Number(reasonId)],
                        })
                      }
                      onRemove={(reasonId) =>
                        updateSelectedFee({
                          reasons: selectedFee!.reasons.filter((reason) => reason !== reasonId),
                        })
                      }
                    />
                  </div>

              </div>

          )}
          {selectedProduct && (
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
          )}
        </div>
      </Form>
    </section>
  );
}
