import "./styles.css";

import { Form, useActionData, useLoaderData } from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import {
  createAttribute,
  deleteAttribute,
  getAttribute,
  updateAttribute,
} from "../../generated/api/client";
import { AttributeType, type AttributeRequest } from "../../generated/api/models";
import { createClientAction, createClientLoader, crudOps } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";
import { attributeTypeOptions } from "./attributeTypeLabels";

const emptyFormValues: AttributeRequest = {
  attributeCode: "",
  attributeName: "",
  attributeType: "" as AttributeType,
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
  mapFormDataToRequest: (formData) => ({
    ...Object.fromEntries(formData),
    attributeCode: String(formData.get("attributeCode")).toUpperCase(),
    attributeType: String(formData.get("attributeType")),
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
                maxLength={25}
                name="attributeCode"
                pattern="[A-Za-z0-9]{1,25}"
                title="Attribute code must be 1 to 25 letters or digits."
                required
                type="text"
                value={formValues.attributeCode}
                onChange={(event) => updateField("attributeCode", event.target.value)}
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
                options={attributeTypeOptions}
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
