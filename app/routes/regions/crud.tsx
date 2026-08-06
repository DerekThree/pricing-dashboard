import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import MultiSelectField from "../../components/MultiSelectField";
import useFormValues from "../../hooks/useFormValues";
import {
  createRegion,
  getRegion,
  getRegionOptions,
  updateRegion,
  deleteRegion,
} from "../../generated/api/client";
import type { RegionDetail, RegionRequest } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit, toDropdownOption } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

function toFormValues(record: RegionDetail) {
  return {
    regionCode: record.regionCode,
    regionName: record.regionName,
    states: record.states,
    zipCodes: record.zipCodes,
    branches: record.branches.map((branch) => branch.id),
  };
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  const emptyFormValues: RegionRequest = {
    regionCode: "",
    regionName: "",
    states: [],
    zipCodes: [],
    branches: [] as number[],
    updatedBy: "",
  };
  const needsRecord = operation !== crudOps.create;
  const needsOptionsEndpoint = operation === crudOps.create || operation === crudOps.update;
  const [recordResponse, optionsResponse] = await Promise.all([
    needsRecord ? getRegion(id) : null,
    needsOptionsEndpoint ? getRegionOptions() : null,
  ]);

  if (recordResponse && recordResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      options: { states: [], zipCodes: [], branches: [] },
      loaderError: getErrorMessage(recordResponse.data, recordResponse.status),
    };
  }

  if (optionsResponse && optionsResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      options: { states: [], zipCodes: [], branches: [] },
      loaderError: getErrorMessage(optionsResponse.data, optionsResponse.status),
    };
  }

  const initialFormValues = recordResponse?.data ? toFormValues(recordResponse.data) : emptyFormValues;
  const options = recordResponse && optionsResponse
    ? {
        states: [...recordResponse.data.states, ...optionsResponse.data.states],
        zipCodes: [...recordResponse.data.zipCodes, ...optionsResponse.data.zipCodes],
        branches: [...recordResponse.data.branches, ...optionsResponse.data.branches],
      }
    : optionsResponse?.data ?? {
        states: recordResponse!.data.states,
        zipCodes: recordResponse!.data.zipCodes,
        branches: recordResponse!.data.branches,
      };

  return { operation, initialFormValues, options, loaderError: null };
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
      regionCode: (formValues.regionCode as string).toUpperCase(),
      states: formValues.states,
      zipCodes: formValues.zipCodes,
      branches: (formValues.branches as string[]).map((branchId) => Number(branchId)),
    }),
});

export default function RegionPage() {
  const { operation, initialFormValues, options, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  function addState(value: string) {
    updateField("states", [...formValues.states, value]);
  }

  function removeState(value: string | number) {
    updateField("states", formValues.states.filter((currentValue: string) => currentValue !== value));
  }

  function addZipCode(value: string | number) {
    updateField("zipCodes", [...formValues.zipCodes, String(value)]);
  }

  function removeZipCode(value: string | number) {
    updateField("zipCodes", formValues.zipCodes.filter((currentValue: string) => currentValue !== value));
  }

  function addBranch(value: string | number) {
    updateField("branches", [...formValues.branches, Number(value)]);
  }

  function removeBranch(value: string | number) {
    updateField("branches", formValues.branches.filter((currentValue) => currentValue !== Number(value)));
  }

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
                maxLength={25}
                name="regionCode"
                pattern="[A-Za-z0-9]{1,25}"
                title="Region code must be 1 to 25 letters or digits."
                required
                type="text"
                value={formValues.regionCode}
                onChange={(event) => updateField("regionCode", event.target.value)}
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
            <MultiSelectField
              disabled={inputsDisabled}
              options={options.branches.map(toDropdownOption)}
              selectedValues={formValues.branches}
              title="Branches"
              onAdd={addBranch}
              onRemove={removeBranch}
            />
            {formValues.branches.map((branchId, index) => (
              <input key={index} name="branches" type="hidden" value={branchId} />
            ))}
          </div>
          <div className="crud-page-form-column">
            <MultiSelectField
              disabled={inputsDisabled}
              options={options.zipCodes.map(toDropdownOption)}
              selectedValues={formValues.zipCodes}
              title="Zip Codes"
              onAdd={addZipCode}
              onRemove={removeZipCode}
            />
            {formValues.zipCodes.map((zipCode: string, index: number) => (
              <input key={index} name="zipCodes" type="hidden" value={zipCode} />
            ))}
          </div>
          <div className="crud-page-form-column">
            <MultiSelectField
              disabled={inputsDisabled}
              options={options.states.map(toDropdownOption)}
              selectedValues={formValues.states}
              title="States"
              onAdd={addState}
              onRemove={removeState}
            />
            {formValues.states.map((state: string, index: number) => (
              <input key={index} name="states" type="hidden" value={state} />
            ))}
          </div>
        </div>
      </Form>
    </section>
  );
}
