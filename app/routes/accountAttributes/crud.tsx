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
            <label className="crud-page-form-field account-attribute-form-field--code">
              <span>Attribute Code</span>
              <input
                name="attributeCode"
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
                name="attributeName"
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
                name="attributeType"
                value={formValues.attributeType}
                disabled={inputsDisabled}
                required
                options={attributeTypeOptions}
                onChange={(value) => updateField("attributeType", value)}
              />
            </div>
          </div>
        </div>
      </Form>
    </section>
  );
}
