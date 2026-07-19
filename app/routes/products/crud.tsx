import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createProduct, deleteProduct, getProduct, updateProduct, } from "../../generated/api/client";
import { AccountType, type ProductRequest } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps, } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

const emptyFormValues = {
  productCode: "",
  productName: "",
  accountType: "",
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
  transformFormValues: (formValues) =>
    ({
      productCode: String(formValues.productCode),
      productName: String(formValues.productName),
      accountType: formValues.accountType as ProductRequest["accountType"],
      updatedBy: String(formValues.updatedBy),
    }) satisfies ProductRequest,
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
            <label className="crud-page-form-field product-form-field--code" htmlFor="product-code">
              <span>Product Code</span>
              <input
                disabled={inputsDisabled}
                id="product-code"
                maxLength={8}
                name="productCode"
                pattern="[A-Z0-9]{8}"
                title="Product code must be exactly 8 uppercase letters or digits."
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
                maxLength={100}
                name="productName"
                required
                title={formValues.productName}
                type="text"
                value={formValues.productName}
                onChange={(event) =>
                  updateField("productName", event.target.value)
                }
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <div className="product-form-field--account-type">
              <Dropdown
                disabled={inputsDisabled}
                label="Account Type"
                name="accountType"
                required
                options={[
                  { value: AccountType.DEPOSIT, label: "Deposit" },
                  { value: AccountType.CREDIT, label: "Credit" },
                ]}
                value={formValues.accountType}
                onChange={(value) => updateField("accountType", value)}
              />
            </div>
          </div>
        </div>
      </Form>
    </section>
  );
}
