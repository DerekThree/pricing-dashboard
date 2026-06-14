import { getApiUrl } from "../config/api";

export type TableRecord = Record<string, unknown>;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiRequest<TResponse>(
  apiEndpoint: string,
  init?: RequestInit,
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(getApiUrl(apiEndpoint), init);
  } catch {
    throw new ApiError(
      503,
      `The app cannot reach the backend right now. Please try again later.`,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.status === 404
        ? `The requested record could not be found.`
        : `The backend returned an error status ${response.status}.`,
    );
  }

  const responseText = await response.text();

  return (responseText ? JSON.parse(responseText) : undefined) as TResponse;
}

export function getApi<TResponse>(apiEndpoint: string): Promise<TResponse> {
  return apiRequest<TResponse>(apiEndpoint);
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

export function deleteApi<TResponse>(apiEndpoint: string): Promise<TResponse> {
  return apiRequest<TResponse>(apiEndpoint, {
    method: "DELETE",
  });
}
