export function getErrorMessage(data: unknown, status?: number) {
  if (typeof data === "string" && data) {
    return data;
  }

  if (data && typeof data === "object") {
    const { detail, error, message, title } = data as Record<string, unknown>;
    const responseMessage = message ?? detail ?? error ?? title;

    if (typeof responseMessage === "string" && responseMessage) {
      return status
        ? `Status ${status}: ${responseMessage}`
        : responseMessage;
    }
  }

  return status
    ? `The backend returned status ${status}.`
    : "The app cannot reach the backend right now. Please try again later.";
}
