import type { FeeOption, PricingPlanFeeRequest } from "../../generated/api/models";

export function isIncompleteFee(fee: PricingPlanFeeRequest) {
  return Number.isNaN(fee.feeId) || Number.isNaN(fee.amount) || fee.amount <= 0;
}

export function reconcileFees(
  rows: PricingPlanFeeRequest[],
  feeOptions: FeeOption[],
  productChanged: boolean,
) {
  return rows.filter(
    (fee) =>
      (!productChanged && Number.isNaN(fee.feeId)) ||
      (feeOptions.some((availableFee) => availableFee.id === fee.feeId) &&
        (!productChanged || !isIncompleteFee(fee))),
  );
}
