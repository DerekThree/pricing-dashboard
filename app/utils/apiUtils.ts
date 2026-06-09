import { getApiUrl } from "../config/api";

export type TableRecord = Record<string, unknown>;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `Request failed: ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiRequest<T>(apiEndpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(apiEndpoint), init);

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  const responseText = await response.text();

  return (responseText ? JSON.parse(responseText) : undefined) as T;
}

export function getApi<T>(apiEndpoint: string): Promise<T> {
  return apiRequest<T>(apiEndpoint);
}

export function postApi<TResponse, TBody>(
  apiEndpoint: string,
  body: TBody,
): Promise<TResponse> {
  return apiRequest<TResponse>(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function putApi<TResponse, TBody>(
  apiEndpoint: string,
  body: TBody,
): Promise<TResponse> {
  return apiRequest<TResponse>(apiEndpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function deleteApi<T>(apiEndpoint: string): Promise<T> {
  return apiRequest<T>(apiEndpoint, {
    method: "DELETE",
  });
}
