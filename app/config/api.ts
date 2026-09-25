import { DEFAULT_API_URL } from "./apiConfig";

declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_URL?: string;
    };
  }
}

export function getApiUrl(path: string) {
  const apiUrl =
    window.__APP_CONFIG__?.API_URL ??
    (import.meta.env.DEV ? DEFAULT_API_URL : undefined);

  if (!apiUrl) {
    throw new Error("API_URL is not configured");
  }

  const normalizedApiUrl = apiUrl.replace(/\/$/, "");
  const apiPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedApiUrl}${apiPath}`;
}
