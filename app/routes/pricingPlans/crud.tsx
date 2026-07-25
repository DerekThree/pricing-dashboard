import "./styles.css";

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
import type { PricingPlanDetail, PricingPlanRequest, ProductRegionOptions } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

function toOffsetDateTime(value: unknown) {
  return typeof value === "string" && value.length > 0 ? `${value}T00:00:00+08:00` : "";
}

function toDateInputValue(value: unknown) {
  return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : "";
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  let initialFormValues: any = {
    planCode: "",
    planName: "",
    productId: "",
    regionId: "",
    activeFrom: "",
    activeTo: "",
  };
  let dropdownOptions: ProductRegionOptions = {
    products: [],
    regions: [],
  };
  let loaderError: string | null = null;

  if (operation === crudOps.create) {
    const response = await getProductRegionOptions();

    if (response.status === 200) {
      dropdownOptions = response.data;
    } else {
      loaderError = getErrorMessage(response.data, response.status);
    }
  } else if (operation === crudOps.update) {
    const [pricingPlanResponse, optionsResponse] = await Promise.all([
      getPricingPlan(Number(id)),
      getProductRegionOptions(),
    ]);

    if (pricingPlanResponse.status === 200) {
      const pricingPlan = pricingPlanResponse.data as PricingPlanDetail;
      initialFormValues = {
        ...pricingPlan,
        productId: pricingPlan.product.id,
        regionId: pricingPlan.region.id,
        activeFrom: toDateInputValue(pricingPlan.activeFrom),
        activeTo: toDateInputValue(pricingPlan.activeTo),
      };
    } else {
      loaderError = getErrorMessage(pricingPlanResponse.data, pricingPlanResponse.status);
    }

    if (optionsResponse.status === 200) {
      dropdownOptions = optionsResponse.data;
    } else if (!loaderError) {
      loaderError = getErrorMessage(optionsResponse.data, optionsResponse.status);
    }
  } else {
    const response = await getPricingPlan(Number(id));

    if (response.status === 200) {
      const pricingPlan = response.data as PricingPlanDetail;
      initialFormValues = {
        ...pricingPlan,
        productId: pricingPlan.product.id,
        regionId: pricingPlan.region.id,
        activeFrom: toDateInputValue(pricingPlan.activeFrom),
        activeTo: toDateInputValue(pricingPlan.activeTo),
      };
      dropdownOptions = {
        products: [pricingPlan.product],
        regions: [pricingPlan.region],
      };
    } else {
      loaderError = getErrorMessage(response.data, response.status);
    }
  }

  return { operation, initialFormValues, dropdownOptions, loaderError };
}

export const clientAction = createClientAction({
  createRecord: createPricingPlan,
  updateRecord: updatePricingPlan,
  deleteRecord: deletePricingPlan,
  listRouteUrl: routeUrls.pricingPlans,
  mapFormValuesToRequest: (formValues) =>
    ({
      ...formValues,
      productId: Number(formValues.productId),
      regionId: Number(formValues.regionId),
      activeFrom: toOffsetDateTime(formValues.activeFrom),
      activeTo: toOffsetDateTime(formValues.activeTo),
    }),
});

export default function PricingPlanPage() {
  const { operation, initialFormValues, dropdownOptions, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
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
        <div className="form-grid">
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
              label="Product Code"
              name="productId"
              required
              options={dropdownOptions.products.map((product) => ({
                value: product.id,
                label: product.code,
                description: product.name,
              }))}
              value={formValues.productId}
              onChange={(value) => updateField("productId", value)}
            />
            <Dropdown
              disabled={inputsDisabled}
              label="Region Code"
              name="regionId"
              required
              options={dropdownOptions.regions.map((region) => ({
                value: region.id,
                label: region.code,
                description: region.name,
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
