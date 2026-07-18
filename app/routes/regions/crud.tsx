import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import type { DropdownOption } from "../../components/Dropdown";
import useFormValues from "../../hooks/useFormValues";
import {
  createRegion,
  getRegion,
  getRegionOptions,
  updateRegion,
  deleteRegion,
} from "../../generated/api/client";
import type { RegionOptions, RegionRequest } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  const [regionResponse, optionsResponse] = await Promise.all([
    operation === crudOps.create ? null : getRegion(Number(id)),
    getRegionOptions(),
  ]);
  let record: RegionRequest = {
    regionCode: "",
    regionName: "",
    states: [],
    zipCodes: [],
    branches: [],
    updatedBy: "",
  };
  let regionOptions: RegionOptions = {
    states: [],
    zipCodes: [],
    branches: [],
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

  if (optionsResponse.status === 200) {
    regionOptions = optionsResponse.data;
  } else {
    regionOptionsError = getErrorMessage(optionsResponse.data, optionsResponse.status);
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

function getBranchOptions(branches: RegionOptions["branches"]): DropdownOption[] {
  return branches.map((branch) => ({
    value: branch.branchCode,
    label: `${branch.branchCode} - ${branch.branchName}`,
    tooltip: branch.branchName,
  }));
}

export default function RegionPage() {
  const { operation, record, regionOptions, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(record);
  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  return (
    <section className="page">
      <Form method="post" onKeyDown={preventEnterSubmit}>
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Region"
          listRouteUrl={routeUrls.regions}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <input name="updatedBy" type="hidden" value={formValues.updatedBy} />
        <div className="form-grid region-form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field region-form-field--code" htmlFor="region-code">
              <span>Region Code</span>
              <input
                disabled={inputsDisabled}
                id="region-code"
                maxLength={8}
                name="regionCode"
                pattern="[0-9]{8}"
                title="Branch code must be exactly 8 digits."                
                required
                type="text"
                value={formValues.regionCode}
                onChange={(event) => updateField("regionCode", event.target.value.toUpperCase())}
              />
            </label>
            <label className="crud-page-form-field" htmlFor="region-name">
              <span>Region Name</span>
              <input
                disabled={inputsDisabled}
                id="region-name"
                maxLength={100}
                name="regionName"
                required
                title={formValues.regionName}
                type="text"
                value={formValues.regionName}
                onChange={(event) => updateField("regionName", event.target.value)}
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <Dropdown
              disabled={inputsDisabled}
              isMulti
              label="States"
              name="states"
              options={regionOptions.states.map((value) => ({ value }))}
              values={formValues.states}
              onChange={(values) => updateField("states", values)}
            />
            <Dropdown
              disabled={inputsDisabled}
              isMulti
              label="Zip Codes"
              name="zipCodes"
              options={regionOptions.zipCodes.map((value) => ({ value }))}
              values={formValues.zipCodes}
              onChange={(values) => updateField("zipCodes", values)}
            />
            <Dropdown
              disabled={inputsDisabled}
              isMulti
              label="Branches"
              name="branches"
              options={getBranchOptions(regionOptions.branches)}
              values={formValues.branches}
              onChange={(values) => updateField("branches", values)}
            />
          </div>
        </div>
      </Form>
    </section>
  );
}
