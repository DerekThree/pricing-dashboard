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

type PricingPlanFormValues = Omit<PricingPlanRequest, "productId" | "regionId"> & {
  productId: number | "";
  regionId: number | "";
};

function toOffsetDateTime(value: unknown) {
  return typeof value === "string" && value.length > 0 ? `${value}T00:00:00+08:00` : "";
}

function toDateInputValue(value: unknown) {
  return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : "";
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  let record: PricingPlanFormValues = {
    planCode: "",
    planName: "",
    productId: "",
    regionId: "",
    activeFrom: "",
    activeTo: "",
    updatedBy: "",
  };
  let pricingPlanOptions: ProductRegionOptions = {
    products: [],
    regions: [],
  };
  let loaderError: string | null = null;

  if (operation === crudOps.create) {
    const response = await getProductRegionOptions();

    if (response.status === 200) {
      pricingPlanOptions = response.data;
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
      record = {
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
      pricingPlanOptions = optionsResponse.data;
    } else if (!loaderError) {
      loaderError = getErrorMessage(optionsResponse.data, optionsResponse.status);
    }
  } else {
    const response = await getPricingPlan(Number(id));

    if (response.status === 200) {
      const pricingPlan = response.data as PricingPlanDetail;
      record = {
        ...pricingPlan,
        productId: pricingPlan.product.id,
        regionId: pricingPlan.region.id,
        activeFrom: toDateInputValue(pricingPlan.activeFrom),
        activeTo: toDateInputValue(pricingPlan.activeTo),
      };
      pricingPlanOptions = {
        products: [pricingPlan.product],
        regions: [pricingPlan.region],
      };
    } else {
      loaderError = getErrorMessage(response.data, response.status);
    }
  }

  return { operation, record, pricingPlanOptions, loaderError };
}

export const clientAction = createClientAction({
  createRecord: createPricingPlan,
  updateRecord: updatePricingPlan,
  deleteRecord: deletePricingPlan,
  listRouteUrl: routeUrls.pricingPlans,
  transformRecord: (record) =>
    ({
      ...record,
      productId: Number(record.productId),
      regionId: Number(record.regionId),
      activeFrom: toOffsetDateTime(record.activeFrom),
      activeTo: toOffsetDateTime(record.activeTo),
    }) as PricingPlanRequest,
});

export default function PricingPlanPage() {
  const { operation, record, pricingPlanOptions, loaderError } = useLoaderData<typeof clientLoader>();
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
              options={pricingPlanOptions.products.map((product) => ({
                value: product.id,
                label: product.code,
                description: product.name,
              }))}
              value={formValues.productId}
              onChange={(value) => updateField("productId", value as PricingPlanFormValues["productId"])}
            />
            <Dropdown
              disabled={inputsDisabled}
              label="Region Code"
              name="regionId"
              required
              options={pricingPlanOptions.regions.map((region) => ({
                value: region.id,
                label: region.code,
                description: region.name,
              }))}
              value={formValues.regionId}
              onChange={(value) => updateField("regionId", value as PricingPlanFormValues["regionId"])}
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
