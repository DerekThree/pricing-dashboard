import "./styles.css";

import { Form, useActionData, useLoaderData } from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createFee, deleteFee, getFee, updateFee } from "../../generated/api/client";
import { ProductType } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

const emptyFormValues = {
  feeCode: "",
  feeName: "",
  productType: "",
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
  mapFormValuesToRequest: (formValues) =>
    ({
      ...formValues,
      productType: formValues.productType as ProductType,
    }),
});

export default function FeePage() {
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
                maxLength={8}
                name="feeCode"
                pattern="[A-Z0-9]{8}"
                title="Fee code must be exactly 8 uppercase letters or digits."
                required
                type="text"
                value={formValues.feeCode}
                onChange={(event) =>
                  updateField("feeCode", event.target.value.toUpperCase())
                }
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
            <div className="fee-form-field--product-type">
              <Dropdown
                disabled={inputsDisabled}
                label="Product Type"
                name="productType"
                required
                options={[
                  { value: ProductType.DEPOSIT, label: "Deposit" },
                  { value: ProductType.CREDIT, label: "Credit" },
                ]}
                value={formValues.productType}
                onChange={(value) => updateField("productType", value)}
              />
            </div>
          </div>
        </div>
      </Form>
    </section>
  );
}
