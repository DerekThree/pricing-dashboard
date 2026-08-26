import "./styles.css";

import type { ColDef } from "ag-grid-community";
import { useState } from "react";
import { useLoaderData } from "react-router";

import Dropdown, { type DropdownOption } from "../../components/Dropdown";
import EditableListField from "../../components/EditableListField";
import PageTopMenu from "../../components/PageTopMenu";
import {
  getSimulatorDate,
  getSimulatorOptions,
  setSimulatorDate,
} from "../../generated/api/client";
import type { SimulatorOptions } from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { showToast } from "../../utils/toast";

const emptyOptions: SimulatorOptions = {
  products: [],
  branches: [],
  fees: [],
  attributes: [],
};

type EmptyRow = { label: string };

const emptyColumnDefs: ColDef<EmptyRow>[] = [{ field: "label" }];
const emptyRows: EmptyRow[] = [];

function toCodeDropdownOption({ code, name }: { code: string; name: string }): DropdownOption {
  return { value: code, label: name, description: code };
}

export async function clientLoader() {
  const [dateResponse, optionsResponse] = await Promise.all([
    getSimulatorDate(),
    getSimulatorOptions(),
  ]);
  const dateLoaded = dateResponse.status === 200;
  const optionsLoaded = optionsResponse.status === 200;
  const loaderError = !dateLoaded
    ? getErrorMessage(dateResponse.data, dateResponse.status)
    : !optionsLoaded
      ? getErrorMessage(optionsResponse.data, optionsResponse.status)
      : null;

  return {
    currentDate: dateLoaded ? dateResponse.data.currentDate : "",
    dateLoaded,
    options: optionsLoaded ? optionsResponse.data : emptyOptions,
    loaderError,
  };
}

export default function SimulatorPage() {
  const { currentDate, dateLoaded, options, loaderError } = useLoaderData<typeof clientLoader>();
  const [applicationDate, setApplicationDate] = useState(currentDate);
  const [actionError, setActionError] = useState<string | null>(null);
  const productOptions = options.products.map(toCodeDropdownOption);
  const branchOptions = options.branches.map(toCodeDropdownOption);
  const feeOptions = options.fees.map(toCodeDropdownOption);

  async function submitDate(currentDate: string) {
    setActionError(null);

    const response = await setSimulatorDate({ currentDate });
    if (response.status === 200) {
      setApplicationDate(response.data.currentDate);
      showToast("Success");
    } else {
      setActionError(getErrorMessage(response.data, response.status));
    }
  }

  return (
    <section className="page">
      <PageTopMenu title="Batch Simulator" />
      {loaderError && <p className="page-error">{loaderError}</p>}
      {actionError && <p className="page-error">{actionError}</p>}
      <div className="form-grid simulator-form-grid">
        <div className="simulator-form-column">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field">
              <span>Application Date</span>
              <input
                type="date"
                value={applicationDate}
                disabled={!dateLoaded}
                required
                onChange={(event) => submitDate(event.target.value)}
              />
            </label>
          </div>
          <div className="crud-page-form-column">
            <EditableListField<EmptyRow>
              columnDefs={emptyColumnDefs}
              disabled
              rowData={emptyRows}
              title="Accounts"
              onAdd={() => undefined}
              onRemove={() => undefined}
            />
          </div>
        </div>
        <div className="simulator-form-column">
          <div className="crud-page-form-column">
            <div className="selection-list-header">
              <span className="selection-list-title">Account Configuration</span>
            </div>
            <Dropdown
              disabled
              label="Product"
              name="product"
              options={productOptions}
              value={undefined}
              onChange={() => undefined}
            />
            <Dropdown
              disabled
              label="Branch"
              name="branch"
              options={branchOptions}
              value={undefined}
              onChange={() => undefined}
            />
          </div>
        </div>
        <div className="simulator-form-column">
          <div className="crud-page-form-column">
            <EditableListField<EmptyRow>
              columnDefs={emptyColumnDefs}
              disabled
              rowData={emptyRows}
              title="Fee Requests"
              onAdd={() => undefined}
              onRemove={() => undefined}
            />
            <Dropdown
              disabled
              label="Fee Name"
              name="fee"
              options={feeOptions}
              value={undefined}
              onChange={() => undefined}
            />
            <label className="crud-page-form-field">
              <span>Transaction Amount</span>
              <input disabled type="number" value="" onChange={() => undefined} />
            </label>
          </div>
        </div>
        <div className="simulator-form-column">
          <div className="crud-page-form-column">
            <div className="selection-list-header">
              <span className="selection-list-title">Pricing Response</span>
            </div>
            <div className="simulator-response-row">
              <span>Account Status</span>
              <span className="simulator-response-value" />
            </div>
            <div className="simulator-response-row">
              <span>Pricing Plan Code</span>
              <span className="simulator-response-value" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
