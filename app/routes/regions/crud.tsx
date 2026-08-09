import "./styles.css";

import { type FormEvent } from "react";
import {
  useActionData,
  useLoaderData,
  useSubmit,
  type ClientLoaderFunctionArgs,
  type SubmitTarget,
} from "react-router";

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
import type { RegionDetail, RegionOptions, RegionRequest } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit, toDropdownOption } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

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
      options: { states: [], zipCodes: [], branches: [] } as RegionOptions,
      loaderError: getErrorMessage(recordResponse.data, recordResponse.status),
    };
  }

  if (optionsResponse && optionsResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      options: { states: [], zipCodes: [], branches: [] } as RegionOptions,
      loaderError: getErrorMessage(optionsResponse.data, optionsResponse.status),
    };
  }

  const initialFormValues = recordResponse?.data ? recordResponse.data : emptyFormValues;
  const options = recordResponse && optionsResponse
    ? {
        states: [...recordResponse.data.recordOptions.states, ...optionsResponse.data.states],
        zipCodes: [...recordResponse.data.recordOptions.zipCodes, ...optionsResponse.data.zipCodes],
        branches: [...recordResponse.data.recordOptions.branches, ...optionsResponse.data.branches],
      }
    : optionsResponse?.data ?? recordResponse!.data.recordOptions;

  return { operation, initialFormValues, options, loaderError: null };
}

export const clientAction = createClientAction({
  createRecord: createRegion,
  updateRecord: updateRegion,
  deleteRecord: deleteRegion,
  listRouteUrl: routeUrls.regions,
});

export default function RegionPage() {
  const { operation, initialFormValues, options, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
  const submit = useSubmit();

  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(
      { ...formValues, regionCode: formValues.regionCode.toUpperCase() } as unknown as SubmitTarget,
      { method: "post", encType: "application/json" },
    );
  }

  function addState(value: string) {
    updateField("states", [...formValues.states, value]);
  }

  function removeState(value: string | number) {
    updateField("states", formValues.states.filter((currentValue) => currentValue !== value));
  }

  function addZipCode(value: string | number) {
    updateField("zipCodes", [...formValues.zipCodes, String(value)]);
  }

  function removeZipCode(value: string | number) {
    updateField("zipCodes", formValues.zipCodes.filter((currentValue) => currentValue !== value));
  }

  function addBranch(value: string | number) {
    updateField("branches", [...formValues.branches, Number(value)]);
  }

  function removeBranch(value: string | number) {
    updateField("branches", formValues.branches.filter((currentValue) => currentValue !== Number(value)));
  }

  return (
    <section className="page">
      <form onKeyDown={preventEnterSubmit} onSubmit={handleSubmit}>
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
            <label className="crud-page-form-field region-form-field--code">
              <span>Region Code</span>
              <input
                title="Region code must be 1 to 25 letters or digits."
                type="text"
                value={formValues.regionCode}
                disabled={inputsDisabled}
                maxLength={25}
                pattern="[A-Za-z0-9]{1,25}"
                required
                onChange={(event) => updateField("regionCode", event.target.value)}
              />
            </label>
            <label className="crud-page-form-field">
              <span>Region Name</span>
              <input
                title={formValues.regionName}
                type="text"
                value={formValues.regionName}
                disabled={inputsDisabled}
                maxLength={100}
                required
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
          </div>
        </div>
      </form>
    </section>
  );
}
