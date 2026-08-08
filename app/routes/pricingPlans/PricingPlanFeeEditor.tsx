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
  fees: PricingPlanFeeRequest[];
  options: FeeOption[];
  reasons: ReasonOption[];
  disabled: boolean;
  onChange(fees: PricingPlanFeeRequest[]): void;
};

export default function PricingPlanFeeEditor({
  fees,
  options,
  reasons,
  disabled,
  onChange,
}: PricingPlanFeeEditorProps) {
  const [selectedFee, setSelectedFee] = useState<PricingPlanFeeRequest | null>(null);
  const hasIncompleteFee = fees.some(
    (fee) => Number.isNaN(fee.feeId) || Number.isNaN(fee.amount) || fee.amount <= 0,
  );
  const hasAvailableFee = options.some(
    (fee) => !fees.some((pricingPlanFee) => pricingPlanFee.feeId === fee.id),
  );
  const feeOptions = options
    .filter((fee) =>
      fee.id === selectedFee?.feeId ||
      !fees.some((pricingPlanFee) => pricingPlanFee.feeId === fee.id),
    )
    .map(toDropdownOption);
  const selectedFeeType = options.find((fee) => fee.id === selectedFee?.feeId)?.type;
  const reasonOptions = reasons.map(toDropdownOption);

  useEffect(() => {
    const nextFees = fees.filter(
      (fee) => Number.isNaN(fee.feeId) || options.some((availableFee) => availableFee.id === fee.feeId),
    );

    if (nextFees.length !== fees.length) {
      onChange(nextFees);
      setSelectedFee(nextFees[0] ?? null);
      return;
    }

    if (!selectedFee || !fees.includes(selectedFee)) {
      setSelectedFee(fees[0] ?? null);
    }
  }, [options, fees, onChange, selectedFee]);

  function addFee() {
    const fee: PricingPlanFeeRequest = { feeId: NaN, amount: NaN, reasons: [] };

    onChange([...fees, fee]);
    setSelectedFee(fee);

    return fee;
  }

  function removeFee(fee: PricingPlanFeeRequest) {
    const nextFees = fees.filter((currentFee) => currentFee !== fee);

    onChange(nextFees);
    if (selectedFee === fee) {
      setSelectedFee(nextFees[0] ?? null);
    }
  }

  function updateSelectedFee(updatedFee: Partial<PricingPlanFeeRequest>) {
    Object.assign(selectedFee!, updatedFee);
    onChange([...fees]);
  }

  return (
    <div className="pricing-plan-side-column">
      <div className="crud-page-form-column">
        <EditableListField
          addDisabled={hasIncompleteFee || !hasAvailableFee}
          columnDefs={[{
            field: "feeId",
            valueFormatter: ({ data }) => {
              if (!data || Number.isNaN(data.feeId) || Number.isNaN(data.amount) || data.amount <= 0) {
                return "Incomplete";
              }

              return options.find((fee) => fee.id === data.feeId)?.name || "";
            },
          }]}
          hideButtons={disabled}
          rowData={fees}
          title="Fees"
          onAdd={addFee}
          onRemove={removeFee}
          onSelectionChanged={(fee) => setSelectedFee(fee)}
        />
        {fees.map((fee, index) => (
          <input key={index} name="fees" type="hidden" value={JSON.stringify(fee)} />
        ))}
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
