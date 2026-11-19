declare global {
  interface Window {
    __APP_CONFIG__?: {
      BACKEND_API_URL?: string;
      ACCOUNT_PROCESSOR_API_URL?: string;
      TRANSACTION_PROCESSOR_WS_URL?: string;
      TXN_PROCESSOR_WS_RECONNECT_DELAY_MS?: string;
    };
  }
}

export function getTransactionBatchesUrl() {
  const configured = window.__APP_CONFIG__?.TRANSACTION_PROCESSOR_WS_URL ??
    (import.meta.env.DEV
      ? import.meta.env.TRANSACTION_PROCESSOR_WS_URL ?? "ws://localhost:8081/api/v1/mock/txn/batches"
      : "");

  if (configured) {
    return configured;
  }

  const url = new URL("/api/v1/mock/txn/batches", window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function getTransactionBatchesReconnectDelay() {
  const delay = Number(window.__APP_CONFIG__?.TXN_PROCESSOR_WS_RECONNECT_DELAY_MS ??
    (import.meta.env.DEV ? import.meta.env.TXN_PROCESSOR_WS_RECONNECT_DELAY_MS : undefined));
  return Number.isInteger(delay) && delay > 0 && delay <= 2_147_483_647 ? delay : 1_000;
}

export type ApiProvider = "BACKEND_API_URL" | "ACCOUNT_PROCESSOR_API_URL";

export function getApiUrl(path: string, provider: ApiProvider = "BACKEND_API_URL") {
  const apiUrl =
    window.__APP_CONFIG__?.[provider] ??
    (import.meta.env.DEV
      ? import.meta.env[provider] ??
        (provider === "BACKEND_API_URL" ? "http://localhost:8080" : "http://localhost:8081")
      : "");

  const normalizedApiUrl = apiUrl.replace(/\/$/, "");
  const apiPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedApiUrl}${apiPath}`;
}
