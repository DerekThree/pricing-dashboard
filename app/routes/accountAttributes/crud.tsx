import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import {
  createAttribute,
  deleteAttribute,
  getAttribute,
  updateAttribute,
} from "../../generated/api/client";
import { AccountAttributeType } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

const emptyFormValues = {
  attributeCode: "",
  attributeName: "",
  attributeType: "",
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
  mapFormValuesToRequest: (formValues) =>
    ({
      ...formValues,
      attributeType: formValues.attributeType as AccountAttributeType,
    }),
});

export default function AccountAttributePage() {
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
          entityTitle="Account Attribute"
          listRouteUrl={routeUrls.accountAttributes}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <div className="form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field account-attribute-form-field--code" htmlFor="attribute-code">
              <span>Attribute Code</span>
              <input
                disabled={inputsDisabled}
                id="attribute-code"
                maxLength={8}
                name="attributeCode"
                pattern="[A-Z0-9]{8}"
                title="Attribute code must be exactly 8 uppercase letters or digits."
                required
                type="text"
                value={formValues.attributeCode}
                onChange={(event) => updateField("attributeCode", event.target.value.toUpperCase())}
              />
            </label>
            <label className="crud-page-form-field" htmlFor="attribute-name">
              <span>Attribute Name</span>
              <input
                disabled={inputsDisabled}
                id="attribute-name"
                maxLength={100}
                name="attributeName"
                required
                title={formValues.attributeName}
                type="text"
                value={formValues.attributeName}
                onChange={(event) => updateField("attributeName", event.target.value)}
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <div className="account-attribute-form-field--type">
              <Dropdown
                disabled={inputsDisabled}
                label="Attribute Type"
                name="attributeType"
                required
                options={[
                  { value: AccountAttributeType.TEXT, label: "Text" },
                  { value: AccountAttributeType.DECIMAL, label: "Decimal" },
                  { value: AccountAttributeType.INTEGER, label: "Integer" },
                  { value: AccountAttributeType.DATE, label: "Date" },
                  { value: AccountAttributeType.BOOLEAN, label: "Boolean" },
                ]}
                value={formValues.attributeType}
                onChange={(value) => updateField("attributeType", value)}
              />
            </div>
          </div>
        </div>
      </Form>
    </section>
  );
}
