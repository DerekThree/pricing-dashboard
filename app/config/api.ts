const defaultApiBaseUrl = "http://localhost:8080";

export function getApiUrl(path: string) {
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? defaultApiBaseUrl;
  const apiPath = path.startsWith("/") ? path : `/${path}`;

  return `${apiBaseUrl}${apiPath}`;
}
