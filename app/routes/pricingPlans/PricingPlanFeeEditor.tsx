import { Fragment, useEffect, useRef, useState } from "react";

import Dropdown from "../../components/Dropdown";
import EditableListField from "../../components/EditableListField";
import MultiSelectField from "../../components/MultiSelectField";
import {
  FeeType,
  type FeeOption,
  type PricingPlanFee,
  type ReasonOption,
} from "../../generated/api/models";
import { toDropdownOption } from "../../utils/formUtils";

type PricingPlanFeeEditorProps = {
  rows: PricingPlanFee[];
  productId: number;
  feeOptions?: FeeOption[];
  reasonOptions?: ReasonOption[];
  disabled: boolean;
  onChange(fees: PricingPlanFee[]): void;
};

export default function PricingPlanFeeEditor({
  rows,
  productId,
  feeOptions,
  reasonOptions,
  disabled,
  onChange,
}: PricingPlanFeeEditorProps) {
  function isIncompleteFee(fee: PricingPlanFee) {
    return Number.isNaN(fee.feeId) || Number.isNaN(fee.amount) || fee.amount < 0;
  }

  const [selectedFee, setSelectedFee] = useState<PricingPlanFee | null>(null);
  const previousProductId = useRef(productId);
  const hasIncompleteFee = rows.some(isIncompleteFee);
  const hasAvailableFee = feeOptions?.some(
    (fee) => !rows.some((pricingPlanFee) => pricingPlanFee.feeId === fee.id),
  );
  const feeDropdownOptions = feeOptions
    ? feeOptions
      .filter((fee) =>
        fee.id === selectedFee?.feeId ||
        !rows.some((pricingPlanFee) => pricingPlanFee.feeId === fee.id),
      )
      .map(toDropdownOption)
    : [];
  const selectedFeeType = feeOptions?.find((fee) => fee.id === selectedFee?.feeId)?.type;
  const reasonDropdownOptions = reasonOptions ? reasonOptions.map(toDropdownOption) : [];

  useEffect(() => {
    if (disabled || !feeOptions) {
      return;
    }

    const productChanged = previousProductId.current !== productId;
    const nextFees = rows.filter((fee) =>
        (!productChanged && Number.isNaN(fee.feeId)) ||
        (feeOptions.some((availableFee) => availableFee.id === fee.feeId) &&
          (!productChanged || !isIncompleteFee(fee))),
    );

    previousProductId.current = productId;

    if (nextFees.length !== rows.length) {
      onChange(nextFees);
      setSelectedFee(nextFees[0] ?? null);
      return;
    }

    if (!selectedFee || !rows.includes(selectedFee)) {
      setSelectedFee(rows[0] ?? null);
    }
  }, [productId, feeOptions, rows, disabled, onChange, selectedFee]);

  function addFee() {
    const fee: PricingPlanFee = { feeId: NaN, amount: NaN, reasonIds: [] };

    onChange([...rows, fee]);
    setSelectedFee(fee);

    return fee;
  }

  function removeFee(fee: PricingPlanFee) {
    const nextFees = rows.filter((currentFee) => currentFee !== fee);

    onChange(nextFees);
    if (selectedFee === fee) {
      setSelectedFee(nextFees[0] ?? null);
    }
  }

  function updateSelectedFee(updatedFee: Partial<PricingPlanFee>) {
    Object.assign(selectedFee!, updatedFee);
    onChange([...rows]);
  }

  return (
      <Fragment>
        <EditableListField
          addDisabled={disabled || hasIncompleteFee || !hasAvailableFee}
          columnDefs={[
            {
              field: "feeId",
              valueFormatter: ({ data }) =>
                !data || isIncompleteFee(data)
                  ? "Incomplete"
                  : feeOptions?.find((fee) => fee.id === data.feeId)?.name ?? "Unavailable",
            },
            {
              cellStyle: { paddingRight: "0.5rem", textAlign: "right" },
              flex: 0,
              headerName: "Amount",
              maxWidth: 64,
              minWidth: 64,
              valueGetter: ({ data }) => {
                const fee = feeOptions?.find(({ id }) => id === data?.feeId);
                if (!data || isIncompleteFee(data) || !fee) {
                  return;
                }

                return fee.type === FeeType.PERCENT ? `${data.amount}%` : `$${data.amount}`;
              },
              width: 64,
            },
          ]}
          hideButtons={disabled}
          rowData={rows}
          title="Fees"
          onAdd={addFee}
          onRemove={removeFee}
          onSelectionChanged={(fee) => setSelectedFee(fee)}
        />
        <Dropdown
          label="Fee Name"
          value={selectedFee?.feeId}
          disabled={disabled || !selectedFee}
          options={feeDropdownOptions}
          placeholder={!selectedFee ? "No fee selected" : undefined}
          onChange={(feeId) => updateSelectedFee({ feeId: Number(feeId) })}
        />
        <label className="crud-page-form-field">
          <span>Fee Amount{selectedFeeType === FeeType.PERCENT ? " (%)" : " ($)"}</span>
          <input
            type="number"
            value={selectedFee?.amount ?? ""}
            min={0}
            disabled={disabled || !selectedFee}
            placeholder={!selectedFee ? "No fee selected" : undefined}
            onChange={(event) => updateSelectedFee({ amount: event.target.value === "" ? NaN : Number(event.target.value) })}
          />
        </label>
        <MultiSelectField
          disabled={disabled || !selectedFee}
          options={reasonDropdownOptions}
          selectedValues={selectedFee?.reasonIds ?? []}
          title="Reasons to waive"
          onAdd={(reasonId) =>
            updateSelectedFee({ reasonIds: [...(selectedFee!.reasonIds ?? []), Number(reasonId)] })
          }
          onRemove={(reasonId) =>
            updateSelectedFee({ reasonIds: (selectedFee!.reasonIds ?? []).filter((reason) => reason !== reasonId) })
          }
        />
      </Fragment>
  );
}
