import Ajv from "ajv";
import addFormats from "ajv-formats";

import { getTransactionBatchesUrl } from "../config/api";
import schema from "../generated/transactionProcessor/transaction-batch-v1.json";
import type { TransactionBatch } from "../generated/transactionProcessor/models";

const validate = addFormats(new Ajv()).compile<TransactionBatch>(schema);

export function connectTransactionBatches(onResult: (result: TransactionBatch) => void) {
  const socket = new WebSocket(getTransactionBatchesUrl());
  socket.onmessage = ({ data }) => {
    if (typeof data !== "string") {
      return;
    }

    let result: unknown;
    try {
      result = JSON.parse(data);
    } catch {
      return;
    }

    if (validate(result)) {
      onResult(result);
    }
  };

  return () => socket.close();
}
