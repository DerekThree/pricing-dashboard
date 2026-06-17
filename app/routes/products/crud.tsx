import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createProduct, deleteProduct, getProduct, updateProduct, } from "../../generated/api/client";
import { AccountType, type ProductRequest } from "../../generated/api/models";
import { createAction, createLoader, crudOps, } from "../../utils/crudRouteUtils";
import { routeUrls } from "../../routes";

const emptyProductRequest: ProductRequest = {
  productCode: "",
  productName: "",
  accountType: AccountType.DEPOSIT,
  updatedBy: "pricing-dashboard",
};

const routeConfig = {
  emptyRecord: emptyProductRequest,
  listRouteUrl: routeUrls.products,
  getRecord: getProduct,
  createRecord: createProduct,
  updateRecord: updateProduct,
  deleteRecord: deleteProduct,
};

export const loader = createLoader(routeConfig);
export const action = createAction(routeConfig);

export default function ProductPage() {
  const { operation, record, loaderError } = useLoaderData<typeof loader>();
  const { actionError } = useActionData<typeof action>() ?? {};
  const { formValues, updateField } = useFormValues(record);
  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  return (
    <section className="page">
      <Form method="post">
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Product"
          listRouteUrl={routeUrls.products}
          loaderError={loaderError}
        />
        {loaderError && <p className="crud-page-error">{loaderError}</p>}
        {actionError && <p className="crud-page-error">{actionError}</p>}
        <input name="updatedBy" type="hidden" value={formValues.updatedBy} />
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
          <label className="crud-page-form-field" htmlFor="account-type">
            <span>Account Type</span>
            <select
              disabled={inputsDisabled}
              id="account-type"
              name="accountType"
              required
              value={formValues.accountType}
              onChange={(event) =>
                updateField("accountType", event.target.value as ProductRequest["accountType"])
              }
            >
              <option value={AccountType.DEPOSIT}>Deposit</option>
              <option value={AccountType.CREDIT}>Credit</option>
            </select>
          </label>
        </div>
      </Form>
    </section>
  );
}
