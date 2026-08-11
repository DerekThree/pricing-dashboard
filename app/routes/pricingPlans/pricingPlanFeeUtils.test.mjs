import assert from "node:assert/strict";
import test from "node:test";

import { reconcileFees } from "./pricingPlanFeeUtils.ts";

test("removes an incomplete pricing plan fee after the product changes", () => {
  const incompleteFee = { feeId: Number.NaN, amount: Number.NaN, reasonIds: [] };
  const incompleteAmountFee = { feeId: 6, amount: Number.NaN, reasonIds: [] };
  const compatibleFee = { feeId: 5, amount: 10, reasonIds: [] };
  const feeOptions = [{ id: 5 }, { id: 6 }];

  assert.deepEqual(
    reconcileFees([incompleteFee, incompleteAmountFee, compatibleFee], feeOptions, true),
    [compatibleFee],
  );
});

test("retains an incomplete pricing plan fee until the product changes", () => {
  const incompleteFee = { feeId: Number.NaN, amount: Number.NaN, reasonIds: [] };

  assert.deepEqual(reconcileFees([incompleteFee], [], false), [incompleteFee]);
});
