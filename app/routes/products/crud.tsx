import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createProduct, deleteProduct, getProduct, updateProduct, } from "../../generated/api/client";
import { ProductType, type ProductRequest } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps, } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { productTypeOptions } from "./productTypeLabels";
import { routeUrls } from "../../routes";

const emptyFormValues: ProductRequest = {
  productCode: "",
  productName: "",
  productType: "" as ProductType,
  updatedBy: "",
};

export const clientLoader = createClientLoader({
  getRecord: getProduct,
  emptyFormValues,
});

export const clientAction = createClientAction({
  createRecord: createProduct,
  updateRecord: updateProduct,
  deleteRecord: deleteProduct,
  listRouteUrl: routeUrls.products,
  mapFormDataToRequest: (formData) => ({
      ...Object.fromEntries(formData),
      productCode: String(formData.get("productCode")).toUpperCase(),
      productType: formData.get("productType"),
    })
});

export default function ProductPage() {
  const { operation, initialFormValues, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);

  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  return (
    <section className="page">
      <Form method="post" onKeyDown={preventEnterSubmit}>
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Product"
          listRouteUrl={routeUrls.products}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <div className="form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field product-form-field--code">
              <span>Product Code</span>
              <input
                name="productCode"
                title="Product code must be 1 to 25 letters or digits."
                type="text"
                value={formValues.productCode}
                disabled={inputsDisabled}
                maxLength={25}
                pattern="[A-Za-z0-9]{1,25}"
                required
                onChange={(event) => updateField("productCode", event.target.value)}
              />
            </label>
            <label className="crud-page-form-field">
              <span>Product Name</span>
              <input
                name="productName"
                title={formValues.productName}
                type="text"
                value={formValues.productName}
                disabled={inputsDisabled}
                maxLength={100}
                required
                onChange={(event) =>
                  updateField("productName", event.target.value)
                }
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <div className="product-form-field--product-type">
              <Dropdown
                label="Product Type"
                name="productType"
                value={formValues.productType}
                disabled={inputsDisabled}
                required
                options={productTypeOptions}
                onChange={(value) => updateField("productType", value)}
              />
            </div>
          </div>
        </div>
      </Form>
    </section>
  );
}
