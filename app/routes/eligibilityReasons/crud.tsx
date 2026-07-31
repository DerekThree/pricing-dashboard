import "./styles.css";

import { type ColDef } from "ag-grid-community";
import { useState } from "react";
import { Form, type ClientLoaderFunctionArgs, useActionData, useLoaderData } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import Dropdown from "../../components/Dropdown";
import SelectionList from "../../components/SelectionList";
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
  type AccountAttributeOption,
  type AccountAttributeType as AccountAttributeTypeValue,
  type Id,
  type ReasonCondition,
  type ReasonConditionValue,
  ReasonOperator,
} from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit } from "../../utils/formUtils";

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
  const operators = attributeType === AccountAttributeType.TEXT
    ? [ReasonOperator["="], ReasonOperator["<>"]]
    : Object.values(ReasonOperator) as ReasonOperator[];
  
  return operators.map((value) => ({ value, label: value }));
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
  const [selectedCondition, setSelectedCondition] = useState<ReasonCondition | null>(null);
  const inputsDisabled = !!loaderError || operation === crudOps.view || operation === crudOps.delete;
  const attributeId = selectedCondition?.attributeId ?? NaN;
  const operator = selectedCondition?.operator ?? "";
  const value = selectedCondition?.value ?? "";
  const conditionDetailsDisabled = inputsDisabled || !selectedCondition;
  const attributeLabels = new Map(
    dropdownOptions.attributes.map((attribute) => [attribute.id, attribute.name]),
  );
  const attributeType = dropdownOptions.attributes.find((option) => option.id === attributeId)?.type;

  function addCondition() {
    const newCondition: ReasonCondition = {
      attributeId: NaN,
      operator: "" as ReasonOperator,
      value: "",
    };

    updateField("conditions", [
      ...formValues.conditions,
      newCondition,
    ]);

    return newCondition;
  }

  function removeCondition(row: ReasonCondition) {
    updateField("conditions", formValues.conditions.filter((cond) => cond !== row));
    setSelectedCondition(selectedCondition === row ? null : selectedCondition);
  }

  function updateSelectedCondition(updatedCondition: ReasonCondition) {
    if (!selectedCondition) {
      return;
    }

    Object.assign(selectedCondition, updatedCondition);
    updateField("conditions", [...formValues.conditions]);
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
      valueFormatter: ({ value }) => String(value ?? ""),
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
                required
                title="Code must be exactly 8 uppercase letters or digits."
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
            <SelectionList
              columnDefs={conditionColumnDefs}
              disabled={inputsDisabled}
              rowData={formValues.conditions}
              title="Conditions"
              onAdd={addCondition}
              onRemove={removeCondition}
              onSelectionChange={(condition) => setSelectedCondition(condition)}
            />
            {formValues.conditions.map((condition: ReasonCondition, index: number) => (
              <input key={index} name="conditions" type="hidden" value={JSON.stringify(condition)} />
            ))}
          </div>
          <div className="crud-page-form-column">
            <div className="selection-list-header">
              <span className="selection-list-title">Condition Details</span>
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
                onChange={(attributeId: Id) => {
                  const attribute = dropdownOptions.attributes.find((attr) => attr.id === attributeId);
                  const operator = attribute?.type === AccountAttributeType.BOOLEAN 
                    ? ReasonOperator["="] 
                    : ""  as ReasonOperator;
                  updateSelectedCondition({ attributeId, operator, value: "" });
                }}
              />
              <div className="eligibility-reason-operator-field">
                <Dropdown
                  disabled={conditionDetailsDisabled || !attributeId || attributeType === AccountAttributeType.BOOLEAN}
                  label="Operator"
                  name="condition-widget-operator"
                  noOptionsMessage="Choose attribute"
                  options={getOperatorOptions(attributeType)}
                  placeholder=""
                  value={operator}
                  onChange={(operator: ReasonOperator) => {
                    updateSelectedCondition({ attributeId, operator, value });
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
                        : attributeType === AccountAttributeType.DECIMAL || attributeType === AccountAttributeType.INTEGER
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
