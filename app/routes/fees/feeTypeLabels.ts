import { FeeType } from "../../generated/api/models";

export const feeTypeLabels: Record<FeeType, string> = {
  [FeeType.FLAT]: "Flat",
  [FeeType.PERCENT]: "Percentage",
};
