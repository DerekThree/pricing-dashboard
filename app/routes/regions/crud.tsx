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
  getCoverageOptions,
  updateRegion,
  deleteRegion,
} from "../../generated/api/client";
import type { CoverageOptions, RegionDetail, RegionRequest } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  let record: RegionRequest = {
    regionCode: "",
    regionName: "",
    states: [],
    zipCodes: [],
    branches: [],
    updatedBy: "",
  };
  let options: CoverageOptions = {
    states: [],
    zipCodes: [],
    branches: [],
  };
  let loaderError: string | null = null;

  if (operation === crudOps.create) {
    const response = await getCoverageOptions();

    if (response.status === 200) {
      options = response.data;
    } else {
      loaderError = getErrorMessage(response.data, response.status);
    }
  } else if (operation === crudOps.update) {
    const [regionResponse, optionsResponse] = await Promise.all([
      getRegion(Number(id)),
      getCoverageOptions(),
    ]);

    if (regionResponse.status === 200) {
      const region = regionResponse.data as RegionDetail;
      record = {
        ...region,
        branches: region.branches.map((branch) => branch.id),
      };
    } else {
      loaderError = getErrorMessage(regionResponse.data, regionResponse.status);
    }

    if (optionsResponse.status === 200) {
      options = optionsResponse.data;
    } else if (!loaderError) {
      loaderError = getErrorMessage(optionsResponse.data, optionsResponse.status);
    }
  } else {
    const response = await getRegion(Number(id));

    if (response.status === 200) {
      const region = response.data as RegionDetail;
      record = {
        ...region,
        branches: region.branches.map((branch) => branch.id),
      };
      options = {
        states: region.states,
        zipCodes: region.zipCodes,
        branches: region.branches,
      };
    } else {
      loaderError = getErrorMessage(response.data, response.status);
    }
  }

  return {
    operation,
    record,
    options,
    loaderError,
  };
}

export const clientAction = createClientAction({
  createRecord: createRegion,
  updateRecord: updateRegion,
  deleteRecord: deleteRegion,
  listRouteUrl: routeUrls.regions,
  arrayFields: ["states", "zipCodes", "branches"],
  transformRecord: (record) =>
    ({
      ...record,
      branches: (record.branches as string[]).map((branchId) => Number(branchId)),
    }) as RegionRequest,
});

function getBranchOptions(branches: CoverageOptions["branches"]): DropdownOption[] {
  return branches.map((branch) => ({
    value: branch.id,
    label: branch.code,
    description: branch.name,
  }));
}

export default function RegionPage() {
  const { operation, record, options, loaderError } = useLoaderData<typeof clientLoader>();
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
                pattern="[A-Z0-9]{8}"
                title="Region code must be exactly 8 uppercase letters or digits."
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
              options={options.states.map((value) => ({ value, label: value }))}
              values={formValues.states}
              onChange={(values) => updateField("states", values as RegionRequest["states"])}
            />
            <Dropdown
              disabled={inputsDisabled}
              isMulti
              label="Zip Codes"
              name="zipCodes"
              options={options.zipCodes.map((value) => ({ value, label: value }))}
              values={formValues.zipCodes}
              onChange={(values) => updateField("zipCodes", values as RegionRequest["zipCodes"])}
            />
            <Dropdown
              disabled={inputsDisabled}
              isMulti
              label="Branches"
              name="branches"
              options={getBranchOptions(options.branches)}
              values={formValues.branches}
              onChange={(values) => updateField("branches", values as RegionRequest["branches"])}
            />
          </div>
        </div>
      </Form>
    </section>
  );
}
