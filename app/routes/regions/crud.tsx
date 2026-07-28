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
import type { CoverageOptions } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  const emptyFormValues = {
    regionCode: "",
    regionName: "",
    states: [],
    zipCodes: [],
    branches: [],
  };
  const emptyDropdownOptions: CoverageOptions = {
    states: [],
    zipCodes: [],
    branches: [],
  };

  const needsRecord = operation !== crudOps.create;
  const needsOptionsEndpoint = operation === crudOps.create || operation === crudOps.update;
  const [recordResponse, optionsResponse] = await Promise.all([
    needsRecord ? getRegion(id) : null,
    needsOptionsEndpoint ? getCoverageOptions() : null,
  ]);

  if (recordResponse && recordResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      dropdownOptions: emptyDropdownOptions,
      loaderError: getErrorMessage(recordResponse.data, recordResponse.status),
    };
  }

  if (optionsResponse && optionsResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      dropdownOptions: emptyDropdownOptions,
      loaderError: getErrorMessage(optionsResponse.data, optionsResponse.status),
    };
  }

  const initialFormValues = recordResponse?.data ?? emptyFormValues;
  const dropdownOptions = recordResponse && optionsResponse
    ? {
        states: [...optionsResponse.data.states, ...recordResponse.data.formOptions.states],
        zipCodes: [...optionsResponse.data.zipCodes, ...recordResponse.data.formOptions.zipCodes],
        branches: [...optionsResponse.data.branches, ...recordResponse.data.formOptions.branches]
            .sort((left, right) => left.code.localeCompare(right.code)),
      }
    : optionsResponse?.data ?? recordResponse?.data.formOptions ?? emptyDropdownOptions;

  return { operation, initialFormValues, dropdownOptions, loaderError: null };
}

export const clientAction = createClientAction({
  createRecord: createRegion,
  updateRecord: updateRegion,
  deleteRecord: deleteRegion,
  listRouteUrl: routeUrls.regions,
  arrayFields: ["states", "zipCodes", "branches"],
  mapFormValuesToRequest: (formValues) =>
    ({
      ...formValues,
      states:  formValues.states,
      zipCodes: formValues.zipCodes,
      branches: (formValues.branches as string[]).map((branchId) => Number(branchId)),
    }),
});

function getBranchOptions(branches: CoverageOptions["branches"]): DropdownOption[] {
  return branches.map((branch) => ({
    value: branch.id,
    label: branch.name,
    description: branch.code,
  }));
}

export default function RegionPage() {
  const { operation, initialFormValues, dropdownOptions, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
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
              options={dropdownOptions.states.map((value) => ({ value, label: value }))}
              values={formValues.states}
              onChange={(values) => updateField("states", values)}
            />
            <Dropdown
              disabled={inputsDisabled}
              isMulti
              label="Zip Codes"
              name="zipCodes"
              options={dropdownOptions.zipCodes.map((value) => ({ value, label: value }))}
              values={formValues.zipCodes}
              onChange={(values) => updateField("zipCodes", values)}
            />
            <Dropdown
              disabled={inputsDisabled}
              isMulti
              label="Branches"
              name="branches"
              options={getBranchOptions(dropdownOptions.branches)}
              values={formValues.branches}
              onChange={(values) => updateField("branches", values)}
            />
          </div>
        </div>
      </Form>
    </section>
  );
}
