import type { ValueFormatterParams } from "ag-grid-community";

const listDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

export function listFormatter({ value }: ValueFormatterParams): string {
  return (value as string[]).join(", ");
}

export function dateTimeFormatter({ value }: ValueFormatterParams): string {
  if (typeof value !== "string" || value.length === 0) {
    return value == null ? "" : String(value);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : listDateFormatter.format(date);
}
