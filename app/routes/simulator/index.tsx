import "react-datepicker/dist/react-datepicker.css";
import "./styles.css";

import type { ColDef } from "ag-grid-community";
import { type FormEvent, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { useLoaderData } from "react-router";

import Dropdown, { type DropdownOption } from "../../components/Dropdown";
import EditableListField from "../../components/EditableListField";
import PageTopMenu from "../../components/PageTopMenu";
import {
  getSimulatorDate,
  getSimulatorOptions,
  postBatch,
  setSimulatorDate,
} from "../../generated/api/client";
import {
  AttributeType,
  BatchAccountStatus,
  FeeType,
  type AccountAttributeValue,
  type BatchAccountResult,
  type SimulatorOptions,
} from "../../generated/api/models";
import { getErrorMessage } from "../../utils/apiUtils";
import { showToast } from "../../utils/toast";

const emptyOptions: SimulatorOptions = {
  products: [],
  branches: [],
  fees: [],
  attributes: [],
};

type AccountDraft = {
  accountNumber: string;
  attributes: Partial<Record<string, AccountAttributeValue>>;
  branchCode?: string;
  feeRequests: FeeRequestDraft[];
  nextFeeRequestId: number;
  productCode?: string;
  selectedFeeRequestId?: number;
};

type FeeRequestDraft = {
  code?: string;
  feeRequestId: number;
  transactionAmount?: number;
};

type SubmittableFeeRequest = FeeRequestDraft & { code: string };
type SubmittableAccount = Omit<AccountDraft, "branchCode" | "feeRequests" | "productCode"> & {
  branchCode: string;
  feeRequests: SubmittableFeeRequest[];
  productCode: string;
};

function toCodeDropdownOption({ code, name }: { code: string; name: string }): DropdownOption {
  return { value: code, label: name, description: code };
}

function toPickerDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toRequestDate(value: Date | null) {
  if (!value) {
    return "";
  }

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate(),
  ).padStart(2, "0")}`;
}

function isSubmittableAccount(account: AccountDraft): account is SubmittableAccount {
  return account.productCode !== undefined &&
    account.branchCode !== undefined &&
    account.feeRequests.length > 0 &&
    account.feeRequests.every(({ code }) => code !== undefined);
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
  const [accounts, setAccounts] = useState<AccountDraft[]>([]);
  const [accountResults, setAccountResults] = useState<BatchAccountResult[]>([]);
  const [pending, setPending] = useState(false);
  const [resultView, setResultView] = useState(false);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState<string | null>(null);
  const nextAccountNumber = useRef(10000001);
  const selectedAccount = accounts.find(
    ({ accountNumber }) => accountNumber === selectedAccountNumber,
  );
  const selectedProduct = options.products.find(
    ({ code }) => code === selectedAccount?.productCode,
  );
  const applicableAttributes = selectedProduct
    ? options.attributes.filter(({ productTypes }) => productTypes.includes(selectedProduct.type))
    : [];
  const applicableFees = selectedProduct
    ? options.fees.filter(({ productTypes }) => productTypes.includes(selectedProduct.type))
    : [];
  const selectedFeeRequest = selectedAccount?.feeRequests.find(
    ({ feeRequestId }) => feeRequestId === selectedAccount.selectedFeeRequestId,
  );
  const selectedFee = applicableFees.find(({ code }) => code === selectedFeeRequest?.code);
  const selectedAccountResult = accountResults.find(
    ({ accountNumber }) => accountNumber === selectedAccountNumber,
  );
  const canSend = accounts.length > 0 && accounts.every(isSubmittableAccount);
  const productOptions = options.products.map(toCodeDropdownOption);
  const branchOptions = options.branches.map(toCodeDropdownOption);
  function isIncompleteFeeRequest(feeRequest: FeeRequestDraft) {
    const fee = options.fees.find(({ code }) => code === feeRequest.code);

    return !fee || fee.type === FeeType.PERCENT && (
      feeRequest.transactionAmount === undefined || feeRequest.transactionAmount < 0
    );
  }

  function isIncompleteAccount(account: AccountDraft) {
    const product = options.products.find(({ code }) => code === account.productCode);
    if (!product || !account.branchCode) {
      return true;
    }

    const hasIncompleteAttribute = options.attributes
      .filter(({ productTypes }) => productTypes.includes(product.type))
      .some(({ code }) =>
        account.attributes[code] === undefined || account.attributes[code] === "");

    return hasIncompleteAttribute || account.feeRequests.length === 0 ||
      account.feeRequests.some(isIncompleteFeeRequest);
  }

  const accountColumnDefs: ColDef<AccountDraft>[] = [{
    field: "accountNumber",
    valueFormatter: ({ data }) =>
      !data || isIncompleteAccount(data) ? "Incomplete" : data.accountNumber,
  }];
  const feeColumnDefs: ColDef<FeeRequestDraft>[] = [{
    field: "code",
    valueFormatter: ({ data }) => !data || isIncompleteFeeRequest(data)
      ? "Incomplete"
      : options.fees.find(({ code }) => code === data.code)!.name,
  }];

  function addAccount() {
    const account: AccountDraft = {
      accountNumber: String(nextAccountNumber.current++),
      attributes: {},
      feeRequests: [],
      nextFeeRequestId: 1,
    };

    setAccounts([...accounts, account]);
    setSelectedAccountNumber(account.accountNumber);

    return account;
  }

  function removeAccount(account: AccountDraft) {
    const index = accounts.indexOf(account);
    const nextAccounts = accounts.filter((currentAccount) => currentAccount !== account);

    setAccounts(nextAccounts);
    if (selectedAccountNumber === account.accountNumber) {
      setSelectedAccountNumber(
        (nextAccounts[index] ?? nextAccounts[index - 1])?.accountNumber ?? null,
      );
    }
  }

  function updateSelectedAccount(updatedAccount: Partial<AccountDraft>) {
    Object.assign(selectedAccount!, updatedAccount);
    setAccounts([...accounts]);
  }

  function selectProduct(productCode: string) {
    const productType = options.products.find(({ code }) => code === productCode)!.type;
    const applicableCodes = new Set(
      options.attributes
        .filter(({ productTypes }) => productTypes.includes(productType))
        .map(({ code }) => code),
    );
    const attributes = Object.fromEntries(
      Object.entries(selectedAccount!.attributes)
        .filter(([code]) => applicableCodes.has(code)),
    );
    const applicableFeeCodes = new Set(
      options.fees
        .filter(({ productTypes }) => productTypes.includes(productType))
        .map(({ code }) => code),
    );
    const feeRequests = selectedAccount!.feeRequests.filter(
      ({ code }) => code !== undefined && applicableFeeCodes.has(code),
    );
    const selectedFeeRequestId = feeRequests.some(
      ({ feeRequestId }) => feeRequestId === selectedAccount!.selectedFeeRequestId,
    )
      ? selectedAccount!.selectedFeeRequestId
      : feeRequests[0]?.feeRequestId;

    updateSelectedAccount({ productCode, attributes, feeRequests, selectedFeeRequestId });
  }

  function updateAccountAttribute(code: string, value: AccountAttributeValue) {
    updateSelectedAccount({
      attributes: { ...selectedAccount!.attributes, [code]: value },
    });
  }

  function addFeeRequest() {
    const feeRequest: FeeRequestDraft = {
      feeRequestId: selectedAccount!.nextFeeRequestId++,
    };

    updateSelectedAccount({
      feeRequests: [...selectedAccount!.feeRequests, feeRequest],
      selectedFeeRequestId: feeRequest.feeRequestId,
    });

    return feeRequest;
  }

  function removeFeeRequest(feeRequest: FeeRequestDraft) {
    const index = selectedAccount!.feeRequests.indexOf(feeRequest);
    const feeRequests = selectedAccount!.feeRequests.filter(
      (currentFeeRequest) => currentFeeRequest !== feeRequest,
    );
    const selectedFeeRequestId = selectedAccount!.selectedFeeRequestId === feeRequest.feeRequestId
      ? (feeRequests[index] ?? feeRequests[index - 1])?.feeRequestId
      : selectedAccount!.selectedFeeRequestId;

    updateSelectedAccount({ feeRequests, selectedFeeRequestId });
  }

  function updateSelectedFeeRequest(updatedFeeRequest: Partial<FeeRequestDraft>) {
    Object.assign(selectedFeeRequest!, updatedFeeRequest);
    updateSelectedAccount({ feeRequests: [...selectedAccount!.feeRequests] });
  }

  function selectFee(code: string) {
    const nextFee = options.fees.find((fee) => fee.code === code)!;
    const transactionAmount = nextFee.type === FeeType.FLAT || selectedFee?.type === FeeType.FLAT
      ? undefined
      : selectedFeeRequest!.transactionAmount;

    updateSelectedFeeRequest({ code, transactionAmount });
  }

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

  async function sendBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accounts.every(isSubmittableAccount) || accounts.length === 0) {
      return;
    }

    setActionError(null);
    setAccountResults([]);
    setResultView(true);
    setPending(true);

    const response = await postBatch({
      batchId: crypto.randomUUID(),
      accounts: accounts.map(({
        accountNumber,
        attributes,
        branchCode,
        feeRequests,
        productCode,
      }) => ({
        accountNumber,
        productCode,
        branchCode,
        pricingDate: applicationDate,
        attributes: Object.entries(attributes)
          .filter((entry): entry is [string, AccountAttributeValue] =>
            entry[1] !== undefined)
          .map(([code, value]) => ({ code, value })),
        fees: feeRequests.map(({ code, feeRequestId, transactionAmount }) => ({
          feeRequestId,
          code,
          transactionAmount,
        })),
      })),
    });

    setPending(false);
    if (response.status === 200) {
      setAccountResults(response.data.accounts);
    } else {
      setResultView(false);
      setActionError(getErrorMessage(response.data, response.status));
    }
  }

  function resetBatch() {
    setActionError(null);
    setAccountResults([]);
    setResultView(false);
  }

  return (
    <form className="page" onSubmit={sendBatch}>
      <PageTopMenu
        title="Batch Simulator"
        actions={resultView && !pending
          ? [{ label: "Reset", onClick: resetBatch, variant: "cancel" }]
          : [{ label: "Send", disabled: pending || !canSend, type: "submit" }]}
      />
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
            <EditableListField
              addDisabled={accounts.some(isIncompleteAccount)}
              columnDefs={accountColumnDefs}
              disabled={!!loaderError}
              hideButtons={resultView}
              rowData={accounts}
              title="Accounts"
              onAdd={addAccount}
              onRemove={removeAccount}
              onSelectionChanged={(account) =>
                setSelectedAccountNumber(account?.accountNumber ?? null)}
            />
          </div>
        </div>
        <div className="simulator-form-column">
          <div className="crud-page-form-column">
            <Dropdown
              disabled={!selectedAccount || resultView}
              label="Product"
              name="product"
              options={productOptions}
              required
              value={selectedAccount?.productCode}
              onChange={(productCode) => selectProduct(String(productCode))}
            />
            <Dropdown
              disabled={!selectedAccount || resultView}
              label="Branch"
              name="branch"
              options={branchOptions}
              required
              value={selectedAccount?.branchCode}
              onChange={(branchCode) =>
                updateSelectedAccount({ branchCode: String(branchCode) })}
            />
          </div>
          {selectedAccount?.branchCode && applicableAttributes.length > 0 && (
            <div className="crud-page-form-column">
              {applicableAttributes.map((attribute) => {
                const value = selectedAccount.attributes[attribute.code];
                const name = `account-attribute-${attribute.code}`;

                if (attribute.type === AttributeType.BOOLEAN) {
                  return (
                    <Dropdown
                      key={attribute.code}
                      disabled={resultView}
                      label={attribute.name}
                      name={name}
                      options={[
                        { value: true, label: "True" },
                        { value: false, label: "False" },
                      ]}
                      required
                      value={value}
                      onChange={(value) => updateAccountAttribute(attribute.code, value)}
                    />
                  );
                }

                if (attribute.type === AttributeType.DATE) {
                  return (
                    <div className="crud-page-form-field" key={attribute.code}>
                      <label htmlFor={name}>{attribute.name}</label>
                      <DatePicker
                        autoComplete="off"
                        dateFormat="MM/dd/yyy"
                        disabled={resultView}
                        id={name}
                        required
                        selected={toPickerDate(value as string | undefined)}
                        shouldCloseOnSelect
                        onChange={(date: Date | null) =>
                          updateAccountAttribute(attribute.code, toRequestDate(date))}
                      />
                    </div>
                  );
                }

                return (
                  <label className="crud-page-form-field" key={attribute.code}>
                    <span>{attribute.name}</span>
                    <input
                      disabled={resultView}
                      type={attribute.type === AttributeType.TEXT ? "text" : "number"}
                      value={value === undefined ? "" : String(value)}
                      required
                      step={attribute.type === AttributeType.DECIMAL ? "any" : undefined}
                      onChange={(event) => updateAccountAttribute(
                        attribute.code,
                        attribute.type === AttributeType.TEXT || event.target.value === ""
                          ? event.target.value
                          : Number(event.target.value),
                      )}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="simulator-form-column">
          <div className="crud-page-form-column">
            <EditableListField
              addDisabled={selectedAccount?.feeRequests.some(isIncompleteFeeRequest) ||
                applicableFees.length === 0}
              columnDefs={feeColumnDefs}
              disabled={!selectedProduct}
              hideButtons={resultView}
              rowData={selectedAccount?.feeRequests ?? []}
              title="Fee Requests"
              onAdd={addFeeRequest}
              onRemove={removeFeeRequest}
              onSelectionChanged={(feeRequest) => updateSelectedAccount({
                selectedFeeRequestId: feeRequest?.feeRequestId,
              })}
            />
            <Dropdown
              disabled={!selectedFeeRequest || resultView}
              label="Fee Name"
              name="fee"
              options={applicableFees.map(toCodeDropdownOption)}
              value={selectedFeeRequest?.code}
              onChange={(code) => selectFee(String(code))}
            />
            <label className="crud-page-form-field">
              <span>Transaction Amount</span>
              <input
                disabled={resultView || !selectedFeeRequest || selectedFee?.type === FeeType.FLAT}
                min={0}
                step="any"
                type="number"
                value={selectedFeeRequest?.transactionAmount ?? ""}
                onChange={(event) => updateSelectedFeeRequest({
                  transactionAmount: event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
                })}
              />
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
              <span className="simulator-response-value">{selectedAccountResult?.status}</span>
            </div>
            <div className="simulator-response-row">
              <span>Pricing Plan Code</span>
              <span className="simulator-response-value">
                {selectedAccountResult?.status === BatchAccountStatus.OK
                  ? selectedAccountResult.pricingPlanCode
                  : undefined}
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
