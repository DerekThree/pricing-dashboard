import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createPricingPlan, deletePricingPlan, getPricingPlan, updatePricingPlan, } from "../../generated/api/client";
import type { PricingPlanRequest } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps, } from "../../utils/crudRouteUtils";
import { preventTextInputSubmit } from "../../utils/formUtils";
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
  updatedBy: "pricing-dashboard",
};

export const clientLoader = createClientLoader({
  getRecord: getPricingPlan,
  emptyRequest: emptyPricingPlanRequest,
});

export const clientAction = createClientAction({
  createRecord: createPricingPlan,
  updateRecord: updatePricingPlan,
  deleteRecord: deletePricingPlan,
  listRouteUrl: routeUrls.pricingPlans,
});

export default function PricingPlanPage() {
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
          entityTitle="Pricing Plan"
          listRouteUrl={routeUrls.pricingPlans}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <input name="updatedBy" type="hidden" value={formValues.updatedBy} />
        <div className="crud-page-form-column">
          <label className="crud-page-form-field" htmlFor="plan-code">
            <span>Plan Code</span>
            <input
              disabled={inputsDisabled}
              id="plan-code"
              name="planCode"
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
          <label className="crud-page-form-field" htmlFor="product-name">
            <span>Product Name</span>
            <input
              disabled={inputsDisabled}
              id="product-name"
              name="productName"
              required
              type="text"
              value={formValues.productName}
              onChange={(event) =>
                updateField("productName", event.target.value)
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
          <label className="crud-page-form-field" htmlFor="region-name">
            <span>Region Name</span>
            <input
              disabled={inputsDisabled}
              id="region-name"
              name="regionName"
              required
              type="text"
              value={formValues.regionName}
              onChange={(event) =>
                updateField("regionName", event.target.value)
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
      </Form>
    </section>
  );
}
