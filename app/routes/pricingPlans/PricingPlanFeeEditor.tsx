import { useEffect, useState } from "react";

import Dropdown from "../../components/Dropdown";
import EditableListField from "../../components/EditableListField";
import MultiSelectField from "../../components/MultiSelectField";
import {
  FeeType,
  type FeeOption,
  type PricingPlanFeeRequest,
  type ReasonOption,
} from "../../generated/api/models";
import { toDropdownOption } from "../../utils/formUtils";

type PricingPlanFeeEditorProps = {
  rows: PricingPlanFeeRequest[];
  fees: FeeOption[];
  reasons: ReasonOption[];
  disabled: boolean;
  onChange(fees: PricingPlanFeeRequest[]): void;
};

export default function PricingPlanFeeEditor({
  rows,
  fees,
  reasons,
  disabled,
  onChange,
}: PricingPlanFeeEditorProps) {
  const [selectedFee, setSelectedFee] = useState<PricingPlanFeeRequest | null>(null);
  const hasIncompleteFee = rows.some(
    (fee) => Number.isNaN(fee.feeId) || Number.isNaN(fee.amount) || fee.amount <= 0,
  );
  const hasAvailableFee = fees.some(
    (fee) => !rows.some((pricingPlanFee) => pricingPlanFee.feeId === fee.id),
  );
  const feeOptions = fees
    .filter((fee) =>
      fee.id === selectedFee?.feeId ||
      !rows.some((pricingPlanFee) => pricingPlanFee.feeId === fee.id),
    )
    .map(toDropdownOption);
  const selectedFeeType = fees.find((fee) => fee.id === selectedFee?.feeId)?.type;
  const reasonOptions = reasons.map(toDropdownOption);

  useEffect(() => {
    const nextFees = rows.filter(
      (fee) => Number.isNaN(fee.feeId) || fees.some((availableFee) => availableFee.id === fee.feeId),
    );

    if (nextFees.length !== rows.length) {
      onChange(nextFees);
      setSelectedFee(nextFees[0] ?? null);
      return;
    }

    if (!selectedFee || !rows.includes(selectedFee)) {
      setSelectedFee(rows[0] ?? null);
    }
  }, [fees, rows, onChange, selectedFee]);

  function addFee() {
    const fee: PricingPlanFeeRequest = { feeId: NaN, amount: NaN, reasons: [] };

    onChange([...rows, fee]);
    setSelectedFee(fee);

    return fee;
  }

  function removeFee(fee: PricingPlanFeeRequest) {
    const nextFees = rows.filter((currentFee) => currentFee !== fee);

    onChange(nextFees);
    if (selectedFee === fee) {
      setSelectedFee(nextFees[0] ?? null);
    }
  }

  function updateSelectedFee(updatedFee: Partial<PricingPlanFeeRequest>) {
    Object.assign(selectedFee!, updatedFee);
    onChange([...rows]);
  }

  return (
    <div className="pricing-plan-side-column">
      <div className="crud-page-form-column">
        <EditableListField
          addDisabled={hasIncompleteFee || !hasAvailableFee}
          columnDefs={[{
            field: "feeId",
            valueFormatter: ({ data }) => 
              !data || Number.isNaN(data.feeId) || Number.isNaN(data.amount) || data.amount <= 0
                ? "Incomplete"
                : fees.find((fee) => fee.id === data.feeId)?.name || "",
          }]}
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
          options={feeOptions}
          placeholder={!selectedFee ? "No fee selected" : undefined}
          onChange={(feeId) => updateSelectedFee({ feeId: Number(feeId) })}
        />
        <label className="crud-page-form-field">
          <span>Fee Amount{selectedFeeType === FeeType.PERCENT ? " (%)" : " ($)"}</span>
          <input
            type="number"
            value={selectedFee?.amount || ""}
            disabled={disabled || !selectedFee}
            placeholder={!selectedFee ? "No fee selected" : undefined}
            onChange={(event) => updateSelectedFee({ amount: Number(event.target.value) })}
          />
        </label>
        <MultiSelectField
          disabled={disabled || !selectedFee}
          options={reasonOptions}
          selectedValues={selectedFee?.reasons ?? []}
          title="Reasons to waive"
          onAdd={(reasonId) =>
            updateSelectedFee({ reasons: [...selectedFee!.reasons, Number(reasonId)] })
          }
          onRemove={(reasonId) =>
            updateSelectedFee({ reasons: selectedFee!.reasons.filter((reason) => reason !== reasonId) })
          }
        />
      </div>
    </div>
  );
}
