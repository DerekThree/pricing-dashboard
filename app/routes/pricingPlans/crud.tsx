import "./styles.css";

import { Form, useLoaderData, useParams } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import {
  createCrudRouteHandlers,
  type FormValues,
} from "../../utils/crudRouteUtils";

const pricingPlanFields = [
  "planCode",
  "planName",
  "productCode",
  "productName",
  "regionCode",
  "regionName",
  "activeFrom",
  "activeTo",
] as const;

type PricingPlanFormValues = FormValues<typeof pricingPlanFields>;

const routeHandlers = createCrudRouteHandlers({
  fields: pricingPlanFields,
  apiUrl: "/pricing-plans",
  listRouteUrl: "/pricing-plans",
});

export const action = routeHandlers.action;
export const loader = routeHandlers.loader;

export default function Crud() {
  const { action } = useParams();
  const { record, loaderError } = useLoaderData<typeof loader>();
  const inputsDisabled = !!loaderError || action === "view" || action === "delete";
  const { formValues, updateField } =
    useFormValues<PricingPlanFormValues>(record);

  return (
    <section className="page">
      <Form method="post">
        <CrudPageTopMenu
          action={action}
          entityTitle="Pricing Plan"
          listRouteUrl="/pricing-plans"
          loaderError={loaderError}
        />
        {loaderError && <p className="crud-loader-error">{loaderError}</p>}
        <div className="crud-form-column">
          <label className="crud-form-field" htmlFor="plan-code">
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
          <label className="crud-form-field" htmlFor="plan-name">
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
          <label className="crud-form-field" htmlFor="product-code">
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
          <label className="crud-form-field" htmlFor="product-name">
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
          <label className="crud-form-field" htmlFor="region-code">
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
          <label className="crud-form-field" htmlFor="region-name">
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
          <label className="crud-form-field" htmlFor="active-from">
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
          <label className="crud-form-field" htmlFor="active-to">
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
