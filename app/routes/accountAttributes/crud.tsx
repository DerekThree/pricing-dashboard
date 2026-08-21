import "./styles.css";

import { type FormEvent } from "react";
import { useActionData, useLoaderData, useSubmit, type SubmitTarget } from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import MultiSelectField from "../../components/MultiSelectField";
import useFormValues from "../../hooks/useFormValues";
import {
  createAttribute,
  deleteAttribute,
  getAttribute,
  updateAttribute,
} from "../../generated/api/client";
import { AttributeType, ProductType, type AttributeRequest } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";
import { productTypeOptions } from "../products/productTypeLabels";
import { attributeTypeOptions } from "./attributeTypeLabels";

const emptyFormValues: AttributeRequest = {
  attributeCode: "",
  attributeName: "",
  attributeType: "" as AttributeType,
  productTypes: [],
  updatedBy: "",
};

export const clientLoader = createClientLoader({
  getRecord: getAttribute,
  emptyFormValues,
});

export const clientAction = createClientAction({
  createRecord: createAttribute,
  updateRecord: updateAttribute,
  deleteRecord: deleteAttribute,
  listRouteUrl: routeUrls.accountAttributes,
});

export default function AccountAttributePage() {
  const { operation, initialFormValues, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
  const submit = useSubmit();

  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(
      { ...formValues, attributeCode: formValues.attributeCode.toUpperCase() } as unknown as SubmitTarget,
      { method: "post", encType: "application/json" },
    );
  }

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
      <form onKeyDown={preventEnterSubmit} onSubmit={handleSubmit}>
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Account Attribute"
          listRouteUrl={routeUrls.accountAttributes}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <div className="form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field account-attribute-form-field--code">
              <span>Attribute Code</span>
              <input
                title="Attribute code must be 1 to 25 letters or digits."
                type="text"
                value={formValues.attributeCode}
                disabled={inputsDisabled}
                maxLength={25}
                pattern="[A-Za-z0-9]{1,25}"
                required
                onChange={(event) => updateField("attributeCode", event.target.value)}
              />
            </label>
            <label className="crud-page-form-field">
              <span>Attribute Name</span>
              <input
                title={formValues.attributeName}
                type="text"
                value={formValues.attributeName}
                disabled={inputsDisabled}
                maxLength={100}
                required
                onChange={(event) => updateField("attributeName", event.target.value)}
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <div className="account-attribute-form-field--type">
              <Dropdown
                label="Attribute Type"
                value={formValues.attributeType}
                disabled={inputsDisabled}
                required
                options={attributeTypeOptions}
                onChange={(value) => updateField("attributeType", value)}
              />
            </div>
            <label className="crud-page-form-field">
              <MultiSelectField
                disabled={inputsDisabled}
                options={productTypeOptions}
                selectedValues={formValues.productTypes}
                title="Applicable Product Types"
                onAdd={addProductType}
                onRemove={removeProductType}
              />
            </label>
          </div>
        </div>
      </form>
    </section>
  );
}
