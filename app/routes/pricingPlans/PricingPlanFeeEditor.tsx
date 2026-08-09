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
  feeOptions: FeeOption[];
  reasonOptions: ReasonOption[];
  disabled: boolean;
  onChange(fees: PricingPlanFeeRequest[]): void;
};

export default function PricingPlanFeeEditor({
  rows,
  feeOptions,
  reasonOptions,
  disabled,
  onChange,
}: PricingPlanFeeEditorProps) {
  const [selectedFee, setSelectedFee] = useState<PricingPlanFeeRequest | null>(null);
  const hasIncompleteFee = rows.some(
    (fee) => Number.isNaN(fee.feeId) || Number.isNaN(fee.amount) || fee.amount <= 0,
  );
  const hasAvailableFee = feeOptions.some(
    (fee) => !rows.some((pricingPlanFee) => pricingPlanFee.feeId === fee.id),
  );
  const feeDropdownOptions = feeOptions
    .filter((fee) =>
      fee.id === selectedFee?.feeId ||
      !rows.some((pricingPlanFee) => pricingPlanFee.feeId === fee.id),
    )
    .map(toDropdownOption);
  const selectedFeeType = feeOptions.find((fee) => fee.id === selectedFee?.feeId)?.type;
  const reasonDropdownOptions = reasonOptions.map(toDropdownOption);

  useEffect(() => {
    const nextFees = rows.filter(
      (fee) => Number.isNaN(fee.feeId) || feeOptions.some((availableFee) => availableFee.id === fee.feeId),
    );

    if (nextFees.length !== rows.length) {
      onChange(nextFees);
      setSelectedFee(nextFees[0] ?? null);
      return;
    }

    if (!selectedFee || !rows.includes(selectedFee)) {
      setSelectedFee(rows[0] ?? null);
    }
  }, [feeOptions, rows, onChange, selectedFee]);

  function addFee() {
    const fee: PricingPlanFeeRequest = { feeId: NaN, amount: NaN, reasonIds: [] };

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
                : feeOptions.find((fee) => fee.id === data.feeId)?.name || "",
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
          options={feeDropdownOptions}
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
      </div>
    </div>
  );
}
