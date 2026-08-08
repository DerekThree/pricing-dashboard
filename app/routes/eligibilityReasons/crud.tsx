import "./styles.css";

import { type ColDef } from "ag-grid-community";
import { useState } from "react";
import { Form, type ClientLoaderFunctionArgs, useActionData, useLoaderData } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import Dropdown from "../../components/Dropdown";
import EditableListField from "../../components/EditableListField";
import useFormValues from "../../hooks/useFormValues";
import {
  createReason,
  deleteReason,
  getReason,
  getReasonOptions,
  updateReason,
} from "../../generated/api/client";
import {
  AttributeType,
  type AttributeType as AttributeTypeValue,
  type Id,
  type ReasonCondition,
  type ReasonDetail,
  ReasonOperator,
  type ReasonOptions,
  type ReasonRequest,
} from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { createClientAction, crudOps, validateCrudRouteParams } from "../../utils/crudRouteUtils";
import { preventEnterSubmit, toDropdownOption } from "../../utils/formUtils";

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { operation, id } = validateCrudRouteParams(params);
  const emptyFormValues: ReasonRequest = {
    reasonCode: "",
    reasonName: "",
    conditions: [] as ReasonCondition[],
    updatedBy: "",
  };

  const needsRecord = operation !== crudOps.create;
  const needsOptionsEndpoint = operation === crudOps.create || operation === crudOps.update;
  const [recordResponse, optionsResponse] = await Promise.all([
    needsRecord ? getReason(id) : null,
    needsOptionsEndpoint ? getReasonOptions() : null,
  ]);

  function toFormValues(record: ReasonDetail):ReasonRequest {
    return {
      ...record,
      conditions: record.conditions.map((condition) => ({
        ...condition,
        attributeId: condition.attribute.id,
      })),
    };
  }

  if (recordResponse && recordResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      options: { attributes: [] } as ReasonOptions,
      loaderError: getErrorMessage(recordResponse.data, recordResponse.status),
    };
  }

  if (optionsResponse && optionsResponse.status !== 200) {
    return {
      operation,
      initialFormValues: emptyFormValues,
      options: { attributes: [] } as ReasonOptions,
      loaderError: getErrorMessage(optionsResponse.data, optionsResponse.status),
    };
  }

  const initialFormValues = recordResponse?.data ? toFormValues(recordResponse.data) : emptyFormValues;
  const options = optionsResponse?.data
    ?? { attributes: recordResponse!.data.conditions.map((condition) => condition.attribute) };

  return { operation, initialFormValues, options, loaderError: null };
}

export const clientAction = createClientAction({
  createRecord: createReason,
  updateRecord: updateReason,
  deleteRecord: deleteReason,
  listRouteUrl: routeUrls.eligibilityReasons,
  mapFormDataToRequest: (formData) => ({
      ...Object.fromEntries(formData),
      reasonCode: String(formData.get("reasonCode")).toUpperCase(),
      reasonName: formData.get("reasonName"),
      conditions: formData.getAll("conditions").map((condition) => JSON.parse(String(condition))),
    }),
});

export default function EligibilityReasonPage() {
  const { operation, initialFormValues, options, loaderError } = useLoaderData<typeof clientLoader>();
  const { actionError } = useActionData<typeof clientAction>() ?? {};
  const { formValues, updateField } = useFormValues(initialFormValues);

  const [selectedCondition, setSelectedCondition] = useState<ReasonCondition | null>(null);
  const inputsDisabled = !!loaderError || operation === crudOps.view || operation === crudOps.delete;
  const conditionDetailsDisabled = inputsDisabled || !selectedCondition;

  const attributeId = selectedCondition?.attributeId ?? NaN;
  const operator = selectedCondition?.operator ?? "" as ReasonOperator;
  const value = selectedCondition?.value ?? "";

  const attributeType = options.attributes.find((attribute) => attribute.id === attributeId)?.type;
  const attributeOptions = options.attributes.map(toDropdownOption);
  const operatorOptions = attributeType === AttributeType.TEXT
    ? [ReasonOperator["="], ReasonOperator["<>"]].map(toDropdownOption)
    : Object.values(ReasonOperator).map(toDropdownOption);

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
      flex: 1.5,
      valueGetter: ({ data }) => options.attributes.find((attribute) => attribute.id === data?.attributeId)?.name,
    },
    { field: "operator", maxWidth: 30 },
    { cellDataType: false, flex: 1, field: "value" },
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
            <label className="crud-page-form-field eligibility-reason-form-field--code">
              <span>Reason Code</span>
              <input
                name="reasonCode"
                title="Code must be 1 to 25 letters or digits."
                type="text"
                value={formValues.reasonCode}
                disabled={inputsDisabled}
                maxLength={25}
                pattern="[A-Za-z0-9]{1,25}"
                required
                onChange={(event) => updateField("reasonCode", event.target.value)}
              />
            </label>
            <label className="crud-page-form-field">
              <span>Reason Name</span>
              <input
                name="reasonName"
                title={formValues.reasonName}
                type="text"
                value={formValues.reasonName}
                disabled={inputsDisabled}
                maxLength={100}
                required
                onChange={(event) => updateField("reasonName", event.target.value)}
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <EditableListField
              columnDefs={conditionColumnDefs}
              disabled={inputsDisabled}
              rowData={formValues.conditions}
              title="Conditions"
              onAdd={addCondition}
              onRemove={removeCondition}
              onSelectionChanged={(condition) => setSelectedCondition(condition)}
            />
            {formValues.conditions.map((condition, index) => (
              <input key={index} name="conditions" type="hidden" value={JSON.stringify(condition)} />
            ))}
          </div>
          {!inputsDisabled && <div className="crud-page-form-column">
            <div className="selection-list-header">
              <span className="selection-list-title">Condition Details</span>
            </div>
            <div
              className={`eligibility-reason-condition-editor ${
                conditionDetailsDisabled ? "eligibility-reason-condition-editor-disabled" : ""
              }`}
            >
              <Dropdown
                label="Attribute"
                name="condition-widget-attribute"
                value={attributeId}
                disabled={conditionDetailsDisabled}
                options={attributeOptions}
                placeholder={conditionDetailsDisabled ? "No condition selected" : undefined}
                onChange={(attributeId: Id) => {
                  const attribute = options.attributes.find((attr) => attr.id === attributeId);
                  const operator = attribute?.type === AttributeType.BOOLEAN
                    ? ReasonOperator["="]
                    : "" as ReasonOperator;
                  updateSelectedCondition({ attributeId, operator, value: "" });
                }}
              />
              <div className="eligibility-reason-operator-field">
                <Dropdown
                  label="Operator"
                  name="condition-widget-operator"
                  value={operator}
                  disabled={conditionDetailsDisabled || !attributeId || attributeType === AttributeType.BOOLEAN}
                  options={operatorOptions}
                  placeholder=""
                  noOptionsMessage="Choose attribute"
                  onChange={(operator: ReasonOperator) => {
                    updateSelectedCondition({ attributeId, operator, value });
                  }}
                />
              </div>
              {attributeType === AttributeType.BOOLEAN ? (
                <div className="crud-page-form-field">
                  <Dropdown
                    label="Value"
                    name="condition-widget-value"
                    value={typeof value === "boolean" ? String(value) : ""}
                    disabled={conditionDetailsDisabled || !attributeId}
                    options={[
                      { value: "true", label: "True" },
                      { value: "false", label: "False" },
                    ]}
                    placeholder={!attributeId ? "No attribute selected" : undefined}
                    onChange={(value) => {
                      updateSelectedCondition({ attributeId, operator, value });
                    }}
                  />
                </div>
              ) : (
                <label className="crud-page-form-field">
                  <span>Value</span>
                  <input
                    type={
                      attributeType === AttributeType.DATE
                        ? "date"
                        : attributeType === AttributeType.DECIMAL || attributeType === AttributeType.INTEGER
                          ? "number"
                          : "text"
                    }
                    value={String(value)}
                    disabled={conditionDetailsDisabled || !attributeId}
                    placeholder={!attributeId ? "No attribute selected" : undefined}
                    step={attributeType === AttributeType.DECIMAL ? "any" : undefined}
                    onChange={(event) => {
                      const value =
                        attributeType === AttributeType.DECIMAL || attributeType === AttributeType.INTEGER
                          ? Number(event.target.value)
                          : event.target.value;
                      updateSelectedCondition({ attributeId, operator, value });
                    }}
                  />
                </label>
              )}
            </div>
          </div>}
        </div>
      </Form>
    </section>
  );
}
