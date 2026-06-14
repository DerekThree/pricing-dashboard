import "./styles.css";

import { Form, useLoaderData, useParams } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import {
  createCrudRouteHandlers,
  type FormValues,
} from "../../utils/crudRouteUtils";

const productFields = [
  "productCode",
  "productName",
  "accountType",
] as const;

type ProductFormValues = FormValues<typeof productFields>;

const routeHandlers = createCrudRouteHandlers({
  fields: productFields,
  apiUrl: "/products",
  listRouteUrl: "/products",
});

export const action = routeHandlers.action;
export const loader = routeHandlers.loader;

export default function Crud() {
  const { action } = useParams();
  const { record, loaderError } = useLoaderData<typeof loader>();
  const inputsDisabled = !!loaderError || action === "view" || action === "delete";
  const { formValues, updateField } = useFormValues<ProductFormValues>(record);

  return (
    <section className="page">
      <Form method="post">
        <CrudPageTopMenu
          action={action}
          entityTitle="Product"
          listRouteUrl="/products"
          loaderError={loaderError}
        />
        {loaderError && <p className="crud-loader-error">{loaderError}</p>}
        <div className="crud-form-column">
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
          <label className="crud-form-field" htmlFor="account-type">
            <span>Account Type</span>
            <input
              disabled={inputsDisabled}
              id="account-type"
              name="accountType"
              required
              type="text"
              value={formValues.accountType}
              onChange={(event) =>
                updateField("accountType", event.target.value)
              }
            />
          </label>
        </div>
      </Form>
    </section>
  );
}
