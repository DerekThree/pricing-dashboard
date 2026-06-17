import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import { createRegion, deleteRegion, getRegion, updateRegion, } from "../../generated/api/client";
import type { RegionRequest } from "../../generated/api/models";
import { createAction, createLoader, crudOps, } from "../../utils/crudRouteUtils";
import { routeUrls } from "../../routes";

const emptyRegionRequest: RegionRequest = {
  regionCode: "",
  regionName: "",
  states: [],
  zipCodes: [],
  branches: [],
  updatedBy: "pricing-dashboard",
};

const routeConfig = {
  emptyRecord: emptyRegionRequest,
  listRouteUrl: routeUrls.regions,
  getRecord: getRegion,
  createRecord: createRegion,
  updateRecord: updateRegion,
  deleteRecord: deleteRegion,
};

export const loader = createLoader(routeConfig);
export const action = createAction(routeConfig);

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderHiddenList(name: keyof RegionRequest, values: string[]) {
  return values.map((value) => (
    <input key={`${name}-${value}`} name={name} type="hidden" value={value} />
  ));
}

export default function RegionPage() {
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
          entityTitle="Region"
          listRouteUrl={routeUrls.regions}
          loaderError={loaderError}
        />
        {loaderError && <p className="crud-page-error">{loaderError}</p>}
        {actionError && <p className="crud-page-error">{actionError}</p>}
        <input name="updatedBy" type="hidden" value={formValues.updatedBy} />
        {renderHiddenList("states", formValues.states)}
        {renderHiddenList("zipCodes", formValues.zipCodes)}
        {renderHiddenList("branches", formValues.branches)}
        <div className="crud-page-form-column">
          <label className="crud-page-form-field" htmlFor="region-code">
            <span>Region Code</span>
            <input
              disabled={inputsDisabled}
              id="region-code"
              name="regionCode"
              required
              type="text"
              value={formValues.regionCode}
              onChange={(event) =>
                updateField("regionCode", event.target.value.toUpperCase())
              }
            />
          </label>
          <label className="crud-page-form-field" htmlFor="region-name">
            <span>Region Name</span>
            <input
              disabled={inputsDisabled}
              id="region-name"
              name="regionName"
              required
              type="text"
              value={formValues.regionName}
              onChange={(event) =>
                updateField("regionName", event.target.value)
              }
            />
          </label>
          <label className="crud-page-form-field" htmlFor="states">
            <span>States</span>
            <input
              disabled={inputsDisabled}
              id="states"
              required
              type="text"
              value={formValues.states.join(", ")}
              onChange={(event) => updateField("states", parseList(event.target.value))}
            />
          </label>
          <label className="crud-page-form-field" htmlFor="zip-codes">
            <span>Zip Codes</span>
            <input
              disabled={inputsDisabled}
              id="zip-codes"
              required
              type="text"
              value={formValues.zipCodes.join(", ")}
              onChange={(event) => updateField("zipCodes", parseList(event.target.value))}
            />
          </label>
          <label className="crud-page-form-field" htmlFor="branches">
            <span>Branches</span>
            <input
              disabled={inputsDisabled}
              id="branches"
              required
              type="text"
              value={formValues.branches.join(", ")}
              onChange={(event) => updateField("branches", parseList(event.target.value))}
            />
          </label>
        </div>
      </Form>
    </section>
  );
}
