declare global {
  interface Window {
    __APP_CONFIG__?: {
      BACKEND_API_URL?: string;
      ACCOUNT_PROCESSOR_API_URL?: string;
    };
  }
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
