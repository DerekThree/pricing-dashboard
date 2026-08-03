import "./styles.css";

import { Form, useLoaderData } from "react-router";
import { useActionData } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import MultiSelectField, { type MultiSelectOption } from "../../components/MultiSelectField";
import useFormValues from "../../hooks/useFormValues";
import {
  createRegion,
  getRegion,
  getRegionOptions,
  updateRegion,
  deleteRegion,
} from "../../generated/api/client";
import type { RegionOptions } from "../../generated/api/models";
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
  const emptyDropdownOptions: RegionOptions = {
    states: [],
    zipCodes: [],
    branches: [],
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
      states: formValues.states,
      zipCodes: formValues.zipCodes,
      branches: (formValues.branches as string[]).map((branchId) => Number(branchId)),
    }),
});

function getBranchOptions(branches: RegionOptions["branches"]): MultiSelectOption[] {
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
  const stateOptions = dropdownOptions.states.map((value: string) => ({ value, label: value }));
  const zipCodeOptions = dropdownOptions.zipCodes.map((value: string) => ({ value, label: value }));
  const branchOptions = getBranchOptions(dropdownOptions.branches);

  function handleAddState(value: string) {
    updateField("states", [...formValues.states, value]);
  }

  function handleRemoveState(value: string) {
    updateField("states", formValues.states.filter((currentValue: string) => currentValue !== value));
  }

  function handleAddZipCode(value: string) {
    updateField("zipCodes", [...formValues.zipCodes, value]);
  }

  function handleRemoveZipCode(value: string) {
    updateField("zipCodes", formValues.zipCodes.filter((currentValue: string) => currentValue !== value));
  }

  function handleAddBranch(value: number) {
    updateField("branches", [...formValues.branches, value]);
  }

  function handleRemoveBranch(value: number) {
    updateField("branches", formValues.branches.filter((currentValue: number) => currentValue !== value));
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
            <MultiSelectField
              disabled={inputsDisabled}
              options={branchOptions}
              selectedValues={formValues.branches}
              title="Branches"
              onAdd={(value) => handleAddBranch(Number(value))}
              onRemove={(value) => handleRemoveBranch(Number(value))}
            />
            {formValues.branches.map((branchId: number, index: number) => (
              <input key={index} name="branches" type="hidden" value={branchId} />
            ))}
          </div>
          <div className="crud-page-form-column">
            <MultiSelectField
              disabled={inputsDisabled}
              options={zipCodeOptions}
              selectedValues={formValues.zipCodes}
              title="Zip Codes"
              onAdd={(value) => handleAddZipCode(String(value))}
              onRemove={(value) => handleRemoveZipCode(String(value))}
            />
            {formValues.zipCodes.map((zipCode: string, index: number) => (
              <input key={index} name="zipCodes" type="hidden" value={zipCode} />
            ))}
          </div>
          <div className="crud-page-form-column">
            <MultiSelectField
              disabled={inputsDisabled}
              options={stateOptions}
              selectedValues={formValues.states}
              title="States"
              onAdd={(value) => handleAddState(String(value))}
              onRemove={(value) => handleRemoveState(String(value))}
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
