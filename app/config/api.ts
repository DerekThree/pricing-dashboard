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
    (import.meta.env.DEV ? "http://localhost:8080" : "");

  const normalizedApiUrl = apiUrl.replace(/\/$/, "");
  const apiPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedApiUrl}${apiPath}`;
}
