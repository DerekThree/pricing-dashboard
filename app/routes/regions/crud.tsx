import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import MultiChoiceDropdown from "../../components/MultiChoiceDropdown";
import useFormValues from "../../hooks/useFormValues";
import {
  createRegion,
  deleteRegion,
  getRegion,
  getRegionOptions,
  updateRegion,
} from "../../generated/api/client";
import type { RegionOptions, RegionRequest } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams, } from "../../utils/crudRouteUtils";
import { preventTextInputSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

const emptyRegionRequest: RegionRequest = {
  regionCode: "",
  regionName: "",
  states: [],
  zipCodes: [],
  branches: [],
  updatedBy: "pricing-dashboard",
};

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);

  const [regionResponse, regionOptionsResponse] = await Promise.all([
    operation === crudOps.create ? null : getRegion(Number(id)),
    getRegionOptions(),
  ]);
  let record: RegionRequest = emptyRegionRequest;
  let regionOptions = {
    states: [] as string[],
    zipCodes: [] as string[],
    branches: [] as string[],
  };
  let regionError: string | null = null;
  let regionOptionsError: string | null = null;

  if (regionResponse) {
    if (regionResponse.status === 200) {
      record = regionResponse.data;
    } else {
      regionError = getErrorMessage(regionResponse.data, regionResponse.status);
    }
  }

  if (regionOptionsResponse.status === 200) {
    regionOptions = regionOptionsResponse.data;
  } else {
    regionOptionsError = getErrorMessage(regionOptionsResponse.data, regionOptionsResponse.status);
  }

  return {
    operation,
    record,
    regionOptions,
    loaderError: regionError ?? regionOptionsError,
  };
}

export const clientAction = createClientAction({
  createRecord: createRegion,
  updateRecord: updateRegion,
  deleteRecord: deleteRegion,
  listRouteUrl: routeUrls.regions,
  arrayFields: ["states", "zipCodes", "branches"],
});

function renderHiddenList(name: keyof RegionRequest, values: string[]) {
  return values.map((value) => (
    <input key={value} name={name} type="hidden" value={value} />
  ));
}

export default function RegionPage() {
  const { operation, record, loaderError, regionOptions } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(record);
  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  return (
    <section className="page">
      <Form method="post" onKeyDown={preventTextInputSubmit}>
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Region"
          listRouteUrl={routeUrls.regions}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <input name="updatedBy" type="hidden" value={formValues.updatedBy} />
        {renderHiddenList("states", formValues.states)}
        {renderHiddenList("zipCodes", formValues.zipCodes)}
        {renderHiddenList("branches", formValues.branches)}
        <div className="form-grid region-form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field region-form-field--code" htmlFor="region-code">
              <span>Region Code</span>
              <input
                disabled={inputsDisabled}
                id="region-code"
                maxLength={8}
                name="regionCode"
                required
                type="text"
                value={formValues.regionCode}
                onChange={(event) =>
                  updateField("regionCode", event.target.value.toUpperCase())
                }
              />
            </label>
            <label
              className="crud-page-form-field crud-page-form-field--tooltip"
              data-tooltip={formValues.regionName}
              htmlFor="region-name"
            >
              <span>Region Name</span>
              <input
                disabled={inputsDisabled}
                id="region-name"
                maxLength={100}
                name="regionName"
                required
                type="text"
                value={formValues.regionName}
                onChange={(event) =>
                  updateField("regionName", event.target.value)
                }
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <MultiChoiceDropdown
              disabled={inputsDisabled}
              label="States"
              name="states"
              options={regionOptions.states}
              values={formValues.states}
              onChange={(values) => updateField("states", values)}
            />
            <MultiChoiceDropdown
              disabled={inputsDisabled}
              label="Zip Codes"
              name="zipCodes"
              options={regionOptions.zipCodes}
              values={formValues.zipCodes}
              onChange={(values) => updateField("zipCodes", values)}
            />
            <MultiChoiceDropdown
              disabled={inputsDisabled}
              label="Branches"
              name="branches"
              options={regionOptions.branches}
              values={formValues.branches}
              onChange={(values) => updateField("branches", values)}
            />
          </div>
        </div>
      </Form>
    </section>
  );
}
