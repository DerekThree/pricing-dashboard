import "./styles.css";

import { Form, useActionData, useLoaderData } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import Dropdown from "../../components/Dropdown";
import useFormValues from "../../hooks/useFormValues";
import { createFee, deleteFee, getFee, updateFee } from "../../generated/api/client";
import { FeeType, ProductType, type FeeRequest } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { productTypeOptions } from "../products/productTypeLabels";
import { routeUrls } from "../../routes";
import MultiSelectField from "~/app/components/MultiSelectField";
import { feeTypeLabels } from "./feeTypeLabels";

const emptyFormValues: FeeRequest = {
  feeCode: "",
  feeName: "",
  feeType: "" as FeeType,
  productTypes: [] as ProductType[],
  updatedBy: "",
};

export const clientLoader = createClientLoader({
  getRecord: getFee,
  emptyFormValues,
});

export const clientAction = createClientAction({
  createRecord: createFee,
  updateRecord: updateFee,
  deleteRecord: deleteFee,
  listRouteUrl: routeUrls.fees,
  mapFormDataToRequest: (formData) => ({
    ...Object.fromEntries(formData),
    productTypes: formData.getAll("productTypes"),
    feeCode: String(formData.get("feeCode")).toUpperCase(),
    feeType: formData.get("feeType"),
  }),
});

export default function FeePage() {
  const { operation, initialFormValues, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);

  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  const feeTypeOptions = Object.values(FeeType).map((feeType) => ({
    value: feeType,
    label: feeTypeLabels[feeType],
  }));

  function addProductType(productType: ProductType) {
    updateField("productTypes", [...formValues.productTypes, productType]);
  }

  function removeProductType(productType: ProductType) {
    updateField(
      "productTypes",
      formValues.productTypes.filter((currentProductType) => currentProductType !== productType),
    );
  }

  return (
    <section className="page">
      <Form method="post" onKeyDown={preventEnterSubmit}>
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Fee"
          listRouteUrl={routeUrls.fees}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <div className="form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field fee-form-field--code" htmlFor="fee-code">
              <span>Fee Code</span>
              <input
                disabled={inputsDisabled}
                id="fee-code"
                maxLength={25}
                name="feeCode"
                pattern="[A-Za-z0-9]{1,25}"
                title="Fee code must be 1 to 25 letters or digits."
                required
                type="text"
                value={formValues.feeCode}
                onChange={(event) => updateField("feeCode", event.target.value)}
              />
            </label>
            <label className="crud-page-form-field" htmlFor="fee-name">
              <span>Fee Name</span>
              <input
                disabled={inputsDisabled}
                id="fee-name"
                maxLength={100}
                name="feeName"
                required
                title={formValues.feeName}
                type="text"
                value={formValues.feeName}
                onChange={(event) =>
                  updateField("feeName", event.target.value)
                }
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <label className="fee-form-field">
              <Dropdown
                disabled={inputsDisabled}
                label="Fee Type"
                name="feeType"
                options={feeTypeOptions}
                required
                value={formValues.feeType}
                onChange={(feeType: FeeType) => updateField("feeType", feeType)}
              />
            </label>
            <label className="fee-form-field">
              <MultiSelectField
                disabled={inputsDisabled}
                options={productTypeOptions}
                selectedValues={formValues.productTypes}
                title="Product Types"
                onAdd={addProductType}
                onRemove={removeProductType}
              />
              {formValues.productTypes.map((productType: ProductType, index: number) => (
                <input key={index} name="productTypes" type="hidden" value={productType} />
              ))}
            </label>
          </div>
        </div>
      </Form>
    </section>
  );
}
