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
  AccountAttributeType,
  EligibilityReasonOperator,
  type AccountAttributeType as AccountAttributeTypeValue,
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

function getOperatorOptions(attributeType?: AccountAttributeTypeValue) {
  return attributeType === AccountAttributeType.TEXT
    ? [EligibilityReasonOperator["="], EligibilityReasonOperator["<>"]]
    : Object.values(EligibilityReasonOperator) as EligibilityReasonOperator[];
}

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
  arrayFields: ["conditions"],
  mapFormValuesToRequest: (formValues) =>
    ({
      reasonCode: formValues.reasonCode,
      reasonName: formValues.reasonName,
      conditions: (formValues.conditions as string[]).map((condition) => JSON.parse(condition) as EligibilityReasonCondition),
      updatedBy: formValues.updatedBy,
    }),
});

export default function EligibilityReasonPage() {
  const { operation, initialFormValues, dropdownOptions, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
  const [attributeId, setAttributeId] = useState<number>(NaN);
  const [operator, setOperator] = useState("");
  const [value, setValue] = useState("");
  const inputsDisabled = !!loaderError || operation === crudOps.view || operation === crudOps.delete;
  const conditionDetailsHidden = !attributeId;
  const attributeLabels = new Map(dropdownOptions.attributes.map((attribute) => [attribute.id, attribute.name]));
  const attributeType = dropdownOptions.attributes.find((option) => option.id === attributeId)?.type;

  function addCondition() {
    const conditionValue = attributeType === AccountAttributeType.BOOLEAN
      ? value === "true"
      : attributeType === AccountAttributeType.DECIMAL || attributeType === AccountAttributeType.INTEGER
        ? Number(value)
        : value;

    const updatedConditions = [
      ...formValues.conditions, 
      { 
        attribute: attributeId, 
        operator: operator as EligibilityReasonOperator, 
        value: conditionValue 
      }
    ];

    updateField("conditions", updatedConditions);
    setAttributeId(NaN);
    setOperator("");
    setValue("");
  }

  function removeCondition(rowIndex: number) {
    updateField("conditions", formValues.conditions.filter((_, index) => index !== rowIndex));
  }

  const conditionColumnDefs: ColDef<EligibilityReasonCondition>[] = [
    {
      field: "attribute",
      headerName: "Attribute",
      valueFormatter: ({ value }) => attributeLabels.get(value) ?? "",
    },
    { field: "operator", width: 36, headerName: "Operator" },
    {
      cellDataType: false,
      field: "value",
      headerName: "Value",
      valueFormatter: ({ value }) => (typeof value === "boolean" ? String(value) : value),
    },
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
              <span className="eligibility-reason-conditions-title">Conditions</span>
            </div>
            <div className={`eligibility-reason-conditions-table ${formValues.conditions.length === 0 ? "eligibility-reason-conditions-table-empty" : ""}`}>
              <AgGridReact
                columnDefs={conditionColumnDefs}
                domLayout={"autoHeight"}
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
            {formValues.conditions.map((condition, index) => (
              <input key={index} name="conditions" type="hidden" value={JSON.stringify(condition)} />
            ))}
          </div>
          <div className="crud-page-form-column">
            <div className="eligibility-reason-conditions-header">
              <span className="eligibility-reason-conditions-title">Add Condition</span>
            </div>
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
                value={attributeId}
                onChange={(nextAttributeId) => {
                  setAttributeId(nextAttributeId);
                  const nextAttributeType = dropdownOptions.attributes.find((attribute) => attribute.id === nextAttributeId)?.type;
                  setOperator(nextAttributeType === AccountAttributeType.BOOLEAN ? EligibilityReasonOperator["="] : "");
                  setValue("");
                }}
              />
              <div className={`eligibility-reason-operator-field ${!attributeId ? "visibility-hidden" : ""}`}>
                <Dropdown
                  disabled={inputsDisabled || attributeType === AccountAttributeType.BOOLEAN}
                  label="Operator"
                  name="condition-widget-operator"
                  noOptionsMessage="Choose attribute"
                  options={getOperatorOptions(attributeType).map((value) => ({ value, label: value }))}
                  placeholder=""
                  value={operator}
                  onChange={setOperator}
                />
              </div>
              {attributeType === AccountAttributeType.BOOLEAN ? (
                <div className={`crud-page-form-field ${!attributeId ? "visibility-hidden" : ""}`}>
                  <Dropdown
                    disabled={inputsDisabled}
                    label="Value"
                    name="condition-widget-value"
                    options={[
                      { value: "true", label: "True" },
                      { value: "false", label: "False" },
                    ]}
                    value={value}
                    onChange={setValue}
                  />
                </div>
              ) : (
                <label className={`crud-page-form-field ${!attributeId ? "visibility-hidden" : ""}`} htmlFor="condition-widget-value">
                  <span>Value</span>
                  <input
                    disabled={inputsDisabled}
                    id="condition-widget-value"
                    step={attributeType === AccountAttributeType.DECIMAL ? "any" : undefined}
                    type={
                      attributeType === AccountAttributeType.DATE
                        ? "date"
                        : attributeType === AccountAttributeType.DECIMAL ||
                            attributeType === AccountAttributeType.INTEGER
                          ? "number"
                          : "text"
                    }
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </label>
              )}
              <button
                className={`eligibility-reason-remove-button ${conditionDetailsHidden ? "visibility-hidden" : ""}`}
                disabled={inputsDisabled || !attributeId || !operator || !value}
                type="button"
                onClick={addCondition}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </Form>
    </section>
  );
}
