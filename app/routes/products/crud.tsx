import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createProduct, deleteProduct, getProduct, updateProduct, } from "../../generated/api/client";
import { AccountType, type ProductRequest } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps, } from "../../utils/crudRouteUtils";
import { preventTextInputSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

const emptyProductRequest: ProductRequest = {
  productCode: "",
  productName: "",
  accountType: AccountType.DEPOSIT,
  updatedBy: "pricing-dashboard",
};

export const clientLoader = createClientLoader({
  getRecord: getProduct,
  emptyRequest: emptyProductRequest,
});

export const clientAction = createClientAction({
  createRecord: createProduct,
  updateRecord: updateProduct,
  deleteRecord: deleteProduct,
  listRouteUrl: routeUrls.products,
});

export default function ProductPage() {
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
          entityTitle="Product"
          listRouteUrl={routeUrls.products}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
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
