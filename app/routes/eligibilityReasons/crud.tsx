import "./styles.css";

import {
  AllCommunityModule,
  type ICellRendererParams,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type SelectionChangedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useState } from "react";
import { Form, type ClientLoaderFunctionArgs, useActionData, useLoaderData } from "react-router";

import Dropdown from "../../components/Dropdown";
import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import {
  createReason,
  deleteReason,
  getReason,
  getReasonOptions,
  updateReason,
} from "../../generated/api/client";
import {
  AccountAttributeType,
  type AccountAttributeType as AccountAttributeTypeValue,
  type AccountAttributeOption,
  type Id,
  type ReasonCondition,
  type ReasonConditionValue,
  ReasonOperator,
} from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";
import { routeUrls } from "../../routes";

ModuleRegistry.registerModules([AllCommunityModule]);

const emptyFormValues = {
  reasonCode: "",
  reasonName: "",
  conditions: [] as ReasonCondition[],
};

const emptyDropdownOptions = {
  attributes: [] as AccountAttributeOption[],
  operators: [] as ReasonOperator[],
};

function getOperatorOptions(attributeType?: AccountAttributeTypeValue) {
  return attributeType === AccountAttributeType.TEXT
    ? [ReasonOperator["="], ReasonOperator["<>"]]
    : Object.values(ReasonOperator) as ReasonOperator[];
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  const needsRecord = operation !== crudOps.create;
  const needsOptionsEndpoint = operation === crudOps.create;
  const [recordResponse, optionsResponse] = await Promise.all([
    needsRecord ? getReason(id) : null,
    needsOptionsEndpoint ? getReasonOptions() : null,
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
    operators: Object.values(ReasonOperator) as ReasonOperator[],
  };

  return { operation, initialFormValues, dropdownOptions, loaderError: null };
}

export const clientAction = createClientAction({
  createRecord: createReason,
  updateRecord: updateReason,
  deleteRecord: deleteReason,
  listRouteUrl: routeUrls.eligibilityReasons,
  arrayFields: ["conditions"],
  mapFormValuesToRequest: (formValues) =>
    ({
      reasonCode: formValues.reasonCode,
      reasonName: formValues.reasonName,
      conditions: (formValues.conditions as string[]).map(
        (condition) => JSON.parse(condition) as ReasonCondition,
      ),
      updatedBy: formValues.updatedBy,
    }),
});

export default function EligibilityReasonPage() {
  const { operation, initialFormValues, dropdownOptions, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const inputsDisabled = !!loaderError || operation === crudOps.view || operation === crudOps.delete;
  const selectedCondition = selectedRowIndex === null ? null : formValues.conditions[selectedRowIndex] ?? null;
  const attributeId = selectedCondition?.attributeId ?? NaN;
  const operator = selectedCondition?.operator ?? "";
  const value = selectedCondition?.value ?? "";
  const conditionDetailsDisabled = inputsDisabled || !selectedCondition;
  const attributeLabels = new Map(dropdownOptions.attributes.map((attribute: AccountAttributeOption) => [attribute.id, attribute.name]));
  const attributeType = dropdownOptions.attributes.find((option) => option.id === attributeId)?.type;

  function addRow() {
    setSelectedRowIndex(formValues.conditions.length);

    updateField("conditions", [
      ...formValues.conditions, 
      {
        attributeId: NaN,
        operator: "" as ReasonOperator,
        value: "",
      }
    ]);
  }

  function removeRow(row: ReasonCondition) {
    setSelectedRowIndex(null);
    updateField("conditions", formValues.conditions.filter((node: ReasonCondition) => node !== row));
  }

  function updateSelectedCondition(updatedCondition: ReasonCondition) {
    updateField(
      "conditions",
      formValues.conditions.map((condition: ReasonCondition, index: number) => (
        index === selectedRowIndex ? updatedCondition : condition
      )),
    );
  }

  function handleConditionSelectionChanged(event: SelectionChangedEvent<ReasonCondition>) {
    const nextSelectedRowIndex = event.api.getSelectedNodes()[0]?.rowIndex;
    setSelectedRowIndex((currentSelectedRowIndex) => nextSelectedRowIndex ?? currentSelectedRowIndex);
  }

  const conditionColumnDefs: ColDef<ReasonCondition>[] = [
    {
      field: "attributeId",
      headerName: "Attribute",
      valueFormatter: ({ value }) => attributeLabels.get(value) ?? "",
    },
    { field: "operator", width: 36, headerName: "Operator" },
    {
      cellDataType: false,
      field: "value",
      headerName: "Value",
      valueFormatter: ({ value }) => typeof value === "boolean" ? String(value) : String(value ?? ""),
    },
    {
      cellRenderer: (params: ICellRendererParams<ReasonCondition>) => (
        <button
          className="eligibility-reason-table-remove"
          disabled={inputsDisabled}
          type="button"
          onClick={() => { if (params.node.data) { removeRow(params.node.data); }}}
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
              <span>Reason Code</span>
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
              <span>Reason Name</span>
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
              <button
                className="eligibility-reason-add-button"
                disabled={inputsDisabled}
                type="button"
                onClick={addRow}
              >
                Add
              </button>
            </div>
            <div
              className={`eligibility-reason-conditions-table ${
                formValues.conditions.length === 0 ? "eligibility-reason-conditions-table-empty" : ""
              }`}
            >
              <AgGridReact
                columnDefs={conditionColumnDefs}
                domLayout="autoHeight"
                headerHeight={0}
                onGridReady={(event) => event.api.sizeColumnsToFit()}
                onGridSizeChanged={(event) => event.api.sizeColumnsToFit()}
                onRowDataUpdated={(event) =>
                  event.api.forEachNode((node) => node.setSelected(node.rowIndex === selectedRowIndex))
                }
                onSelectionChanged={handleConditionSelectionChanged}
                rowData={formValues.conditions}
                rowHeight={20}
                rowSelection={{ mode: "singleRow", enableClickSelection: true, checkboxes: false }}
                suppressNoRowsOverlay
                suppressCellFocus
                suppressHorizontalScroll
                theme={themeQuartz}
              />
            </div>
            {formValues.conditions.map((condition: ReasonCondition, index: number) => (
              <input key={index} name="conditions" type="hidden" value={JSON.stringify(condition)} />
            ))}
          </div>
          <div className="crud-page-form-column">
            <div className="eligibility-reason-conditions-header">
              <span className="eligibility-reason-conditions-title">Condition Details</span>
            </div>
            <div
              className={`eligibility-reason-condition-editor ${
                conditionDetailsDisabled ? "eligibility-reason-condition-editor-disabled" : ""
              }`}
            >
              <Dropdown
                disabled={conditionDetailsDisabled}
                label="Attribute"
                name="condition-widget-attribute"
                options={dropdownOptions.attributes.map((attribute) => ({
                  value: attribute.id,
                  label: attribute.name,
                  description: attribute.code,
                }))}
                placeholder={conditionDetailsDisabled ? "No condition selected" : undefined}
                value={attributeId}
                onChange={(nextAttributeId) => {
                  const nextAttributeType = dropdownOptions.attributes.find(
                    (attribute: AccountAttributeOption) => attribute.id === nextAttributeId,
                  )?.type;
                  const nextOperator =
                    nextAttributeType === AccountAttributeType.BOOLEAN ? ReasonOperator["="] : "";
                  updateSelectedCondition({
                    attributeId: nextAttributeId as Id,
                    operator: nextOperator as ReasonOperator,
                    value: "",
                  });
                }}
              />
              <div className="eligibility-reason-operator-field">
                <Dropdown
                  disabled={conditionDetailsDisabled || !attributeId || attributeType === AccountAttributeType.BOOLEAN}
                  label="Operator"
                  name="condition-widget-operator"
                  noOptionsMessage="Choose attribute"
                  options={getOperatorOptions(attributeType).map((value) => ({ value, label: value }))}
                  placeholder=""
                  value={operator}
                  onChange={(nextOperator) => {
                    updateSelectedCondition({
                      attributeId,
                      operator: nextOperator as ReasonOperator,
                      value,
                    });
                  }}
                />
              </div>
              {attributeType === AccountAttributeType.BOOLEAN ? (
                <div className="crud-page-form-field">
                  <Dropdown
                    disabled={conditionDetailsDisabled || !attributeId}
                    label="Value"
                    name="condition-widget-value"
                    options={[
                      { value: "true", label: "True" },
                      { value: "false", label: "False" },
                    ]}
                    placeholder={!attributeId ? "No attribute selected" : undefined}
                    value={typeof value === "boolean" ? String(value) : ""}
                    onChange={(nextValue) => {
                      updateSelectedCondition({
                        attributeId,
                        operator: operator as ReasonOperator,
                        value: nextValue === "true",
                      });
                    }}
                  />
                </div>
              ) : (
                <label className="crud-page-form-field" htmlFor="condition-widget-value">
                  <span>Value</span>
                  <input
                    disabled={conditionDetailsDisabled || !attributeId}
                    id="condition-widget-value"
                    placeholder={!attributeId ? "No attribute selected" : undefined}
                    step={attributeType === AccountAttributeType.DECIMAL ? "any" : undefined}
                    type={
                      attributeType === AccountAttributeType.DATE
                        ? "date"
                        : attributeType === AccountAttributeType.DECIMAL ||
                            attributeType === AccountAttributeType.INTEGER
                          ? "number"
                          : "text"
                    }
                    value={String(value)}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      const updatedValue =
                        attributeType === AccountAttributeType.DECIMAL || attributeType === AccountAttributeType.INTEGER
                          ? Number(nextValue)
                          : nextValue;
                      updateSelectedCondition({
                        attributeId,
                        operator: operator as ReasonOperator,
                        value: updatedValue as ReasonConditionValue,
                      });
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </Form>
    </section>
  );
}
