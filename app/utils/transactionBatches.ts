import Ajv from "ajv";
import addFormats from "ajv-formats";

import { getTransactionBatchesReconnectDelay, getTransactionBatchesUrl } from "../config/api";
import schema from "../generated/transactionProcessor/transaction-batch-v1.json";
import type { TransactionBatch } from "../generated/transactionProcessor/models";

const validate = addFormats(new Ajv()).compile<TransactionBatch>(schema);

export function connectTransactionBatches(onResult: (result: TransactionBatch) => void) {
  const url = getTransactionBatchesUrl();
  const reconnectDelay = getTransactionBatchesReconnectDelay();
  let reconnectTimer: number | undefined;

  function receive({ data }: MessageEvent<unknown>) {
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
  }

  function connect() {
    const connection = new WebSocket(url);
    connection.onmessage = receive;
    connection.onclose = () => {
      reconnectTimer = window.setTimeout(() => { socket = connect(); }, reconnectDelay);
    };
    return connection;
  }

  let socket = connect();
  return () => {
    window.clearTimeout(reconnectTimer);
    socket.onclose = null;
    socket.onmessage = null;
    socket.close();
  };
}
