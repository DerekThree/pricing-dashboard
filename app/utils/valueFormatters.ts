import type { ValueFormatterParams } from "ag-grid-community";

export function listFormatter({ value }: ValueFormatterParams): string {
  return (value as string[]).join(", ");
}

export function dateTimeFormatter({ value }: ValueFormatterParams): string {
    const DateTimeFormat = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return value && typeof value === "string"
    ? DateTimeFormat.format(new Date(value))
    : "";
}
