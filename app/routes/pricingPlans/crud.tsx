import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createPricingPlan, deletePricingPlan, getPricingPlan, updatePricingPlan, } from "../../generated/api/client";
import type { PricingPlanRequest } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps, } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

const emptyPricingPlanRequest: PricingPlanRequest = {
  planCode: "",
  planName: "",
  productCode: "",
  productName: "",
  regionCode: "",
  regionName: "",
  activeFrom: "",
  activeTo: "",
  updatedBy: "",
};

function toOffsetDateTime(value: unknown) {
  return typeof value === "string" && value.length > 0 ? `${value}T00:00:00+08:00` : "";
}

function toDateInputValue(value: unknown) {
  return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : "";
}

export const clientLoader = createClientLoader({
  getRecord: getPricingPlan,
  emptyRequest: emptyPricingPlanRequest,
  transformRecord: (record) => ({
    ...record,
    activeFrom: toDateInputValue(record.activeFrom),
    activeTo: toDateInputValue(record.activeTo),
  }),
});

export const clientAction = createClientAction({
  createRecord: createPricingPlan,
  updateRecord: updatePricingPlan,
  deleteRecord: deletePricingPlan,
  listRouteUrl: routeUrls.pricingPlans,
  transformRecord: (record) =>
    ({
      ...record,
      activeFrom: toOffsetDateTime(record.activeFrom),
      activeTo: toOffsetDateTime(record.activeTo),
    }) as PricingPlanRequest,
});

export default function PricingPlanPage() {
  const { operation, record, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(record);
  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

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
        <input name="updatedBy" type="hidden" value={formValues.updatedBy} />
        <input name="productName" type="hidden" value={formValues.productName} />
        <input name="regionName" type="hidden" value={formValues.regionName} />
        <div className="form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field" htmlFor="plan-code">
              <span>Plan Code</span>
              <input
                disabled={inputsDisabled}
                id="plan-code"
                name="planCode"
                pattern="[0-9]{8}"
                title="Branch code must be exactly 8 digits."                
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
                name="planName"
                required
                type="text"
                value={formValues.planName}
                onChange={(event) =>
                  updateField("planName", event.target.value)
                }
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <label className="crud-page-form-field" htmlFor="product-code">
              <span>Product Code</span>
              <input
                disabled={inputsDisabled}
                id="product-code"
                name="productCode"
                required
                type="text"
                value={formValues.productCode}
                onChange={(event) =>
                  updateField("productCode", event.target.value.toUpperCase())
                }
              />
            </label>
            <label className="crud-page-form-field" htmlFor="region-code">
              <span>Region Code</span>
              <input
                disabled={inputsDisabled}
                id="region-code"
                name="regionCode"
                required
                type="text"
                value={formValues.regionCode}
                onChange={(event) =>
                  updateField("regionCode", event.target.value.toUpperCase())
                }
              />
            </label>
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
            <label className="crud-page-form-field" htmlFor="active-to">
              <span>Active To</span>
              <input
                disabled={inputsDisabled}
                id="active-to"
                name="activeTo"
                required
                type="date"
                value={formValues.activeTo}
                onChange={(event) =>
                  updateField("activeTo", event.target.value)
                }
              />
            </label>
          </div>
        </div>
      </Form>
    </section>
  );
}
