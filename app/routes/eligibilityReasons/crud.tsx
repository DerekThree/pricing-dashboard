import "./styles.css";

import {
  AllCommunityModule,
  type DomLayoutType,
  type ICellRendererParams,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useState } from "react";
import { Form, type ClientLoaderFunctionArgs, useActionData, useLoaderData } from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import {
  createEligibilityReason,
  deleteEligibilityReason,
  getEligibilityReason,
  getEligibilityReasonOptions,
  updateEligibilityReason,
} from "../../generated/api/client";
import {
  EligibilityReasonOperator,
  type EligibilityReasonCondition,
  type AccountAttributeOption,
} from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

ModuleRegistry.registerModules([AllCommunityModule]);

const emptyFormValues = {
  reasonCode: "",
  reasonName: "",
  conditions: [] as EligibilityReasonCondition[],
};

const emptyDropdownOptions = {
  attributes: [] as AccountAttributeOption[],
  operators: [] as EligibilityReasonOperator[],
};

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  const needsRecord = operation !== crudOps.create;
  const needsOptionsEndpoint = operation === crudOps.create;
  const [recordResponse, optionsResponse] = await Promise.all([
    needsRecord ? getEligibilityReason(id) : null,
    needsOptionsEndpoint ? getEligibilityReasonOptions() : null,
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
  const dropdownOptions = {
    ...(optionsResponse?.data ?? recordResponse?.data.formOptions ?? emptyDropdownOptions),
    operators: Object.values(EligibilityReasonOperator) as EligibilityReasonOperator[],
  };

  return { operation, initialFormValues, dropdownOptions, loaderError: null };
}

export const clientAction = createClientAction({
  createRecord: createEligibilityReason,
  updateRecord: updateEligibilityReason,
  deleteRecord: deleteEligibilityReason,
  listRouteUrl: routeUrls.eligibilityReasons,
  mapFormValuesToRequest: (formValues) =>
    ({
      ...formValues,
      conditions: formValues.conditions,
    }),
});

export default function EligibilityReasonPage() {
  const { operation, initialFormValues, dropdownOptions, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
  const [attribute, setAttribute] = useState("");
  const [operator, setOperator] = useState("");
  const inputsDisabled =
    !!loaderError || operation === crudOps.view || operation === crudOps.delete;
  const conditionsDomLayout: DomLayoutType = "autoHeight";
  const attributeLabels = new Map(dropdownOptions.attributes.map((attribute) => [attribute.id, attribute.name]));

  function removeCondition(rowIndex: number) {
    updateField("conditions", formValues.conditions.filter((_, index) => index !== rowIndex));
  }

  const conditionColumnDefs: ColDef<EligibilityReasonCondition>[] = [
    {
      field: "attribute",
      flex: 1,
      headerName: "Attribute",
      valueFormatter: ({ value }) => attributeLabels.get(value) ?? "",
    },
    { field: "operator", width: 36, headerName: "Operator" },
    { field: "value", flex: 1, headerName: "Value" },
    {
      cellRenderer: (params: ICellRendererParams<EligibilityReasonCondition>) => (
        <button
          className="eligibility-reason-table-remove"
          disabled={inputsDisabled}
          type="button"
          onClick={() => {
            if (typeof params.node.rowIndex === "number") {
              removeCondition(params.node.rowIndex);
            }
          }}
        >
          X
        </button>
      ),
      colId: "remove",
      maxWidth: 32,
      minWidth: 32,
      resizable: false,
      sortable: false,
      width: 32,
    },
  ];

  return (
    <section className="page">
      <Form method="post" onKeyDown={preventEnterSubmit}>
        <CrudPageTopMenu
          operation={operation}
          entityTitle="Eligibility Reason"
          listRouteUrl={routeUrls.eligibilityReasons}
          loaderError={loaderError}
        />
        {loaderError && <p className="page-error">{loaderError}</p>}
        {actionError && <p className="page-error">{actionError}</p>}
        <div className="form-grid eligibility-reason-form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field eligibility-reason-form-field--code" htmlFor="reason-code">
              <span>Code</span>
              <input
                disabled={inputsDisabled}
                id="reason-code"
                maxLength={8}
                name="reasonCode"
                pattern="[A-Z0-9]{8}"
                title="Code must be exactly 8 uppercase letters or digits."
                required
                type="text"
                value={formValues.reasonCode}
                onChange={(event) => updateField("reasonCode", event.target.value.toUpperCase())}
              />
            </label>
            <label className="crud-page-form-field" htmlFor="reason-name">
              <span>Name</span>
              <input
                disabled={inputsDisabled}
                id="reason-name"
                maxLength={100}
                name="reasonName"
                required
                title={formValues.reasonName}
                type="text"
                value={formValues.reasonName}
                onChange={(event) => updateField("reasonName", event.target.value)}
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <div className="eligibility-reason-conditions-header">
              <span className="eligibility-reason-conditions-title">Add Condition</span>
            </div>
            <div className="eligibility-reason-condition-widget">
              <div className="eligibility-reason-condition-editor">
                <Dropdown
                  disabled={inputsDisabled}
                  label="Attribute"
                  name="condition-widget-attribute"
                  options={dropdownOptions.attributes.map((attribute) => ({
                    value: attribute.id,
                    label: attribute.name,
                    description: attribute.code,
                  }))}
                  value={attribute}
                  onChange={setAttribute}
                />
                <Dropdown
                  disabled={inputsDisabled}
                  label="Operator"
                  name="condition-widget-operator"
                  options={dropdownOptions.operators.map((value) => ({ value, label: value }))}
                  placeholder=""
                  value={operator}
                  onChange={setOperator}
                />
                <label className="crud-page-form-field" htmlFor="condition-widget-value">
                  <span>Value</span>
                  <input disabled={inputsDisabled} id="condition-widget-value" type="text" />
                </label>
                <button className="eligibility-reason-remove-button" disabled type="button">
                  Add
                </button>
              </div>
            </div>
          </div>
          <div className="crud-page-form-column">
            <div className="eligibility-reason-conditions-header">
              <span className="eligibility-reason-conditions-title">Conditions</span>
            </div>
            <div className={`eligibility-reason-conditions-table ${formValues.conditions.length === 0 ? "eligibility-reason-conditions-table-empty" : ""}`}>
              <AgGridReact
                columnDefs={conditionColumnDefs}
                domLayout={conditionsDomLayout}
                headerHeight={0}
                onGridReady={(event) => event.api.sizeColumnsToFit()}
                onGridSizeChanged={(event) => event.api.sizeColumnsToFit()}
                rowData={formValues.conditions}
                rowHeight={20}
                suppressNoRowsOverlay
                suppressCellFocus
                suppressHorizontalScroll
                theme={themeQuartz}
              />
            </div>
          </div>
        </div>
      </Form>
    </section>
  );
}
