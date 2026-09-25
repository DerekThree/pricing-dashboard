import { getApiUrl } from "../config/api";

export async function apiMutator<TResponse>(
  url: string,
  init?: RequestInit,
): Promise<TResponse> {
  try {
    const response = await fetch(getApiUrl(url), init);
    const body = [204, 205, 304].includes(response.status)
      ? null
      : await response.text();
    let data = {};

    if (body !== null) {
      if (!body.trim()) {
        data = "Empty response";
      } else {
        try {
          data = JSON.parse(body);
        } catch {
          data = body;
        }
      }
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
    } as TResponse;
  } catch (error) {
    console.error(error);

    return {
      data: {
        message: "The app could not complete the backend request. Please try again later.",
      },
      status: 503,
      headers: new Headers(),
    } as TResponse;
  }
}
