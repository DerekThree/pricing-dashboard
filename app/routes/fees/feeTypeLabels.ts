import { FeeType } from "../../generated/api/models";

export const feeTypeLabels: Record<FeeType, string> = {
  [FeeType.FLAT]: "Flat",
  [FeeType.PERCENT]: "Percentage",
};

export const feeTypeOptions = Object.values(FeeType).map((feeType) => ({
  value: feeType,
  label: feeTypeLabels[feeType],
}));
