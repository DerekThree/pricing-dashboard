import type { DropdownOption } from "../components/shared/DropdownOption";

type RecordOption = {
  id: number;
  name: string;
  code: string;
};

export function preventEnterSubmit(event: React.KeyboardEvent<HTMLFormElement>) {
  if (event.key !== "Enter") {
    return;
  }

  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  ) {
    target.blur();
  }
}

export function toDropdownOption(option: string | boolean | RecordOption): DropdownOption {
  return typeof option === "string" || typeof option === "boolean"
    ? { value: option, label: String(option) }
    : { value: option.id, label: option.name, description: option.code };
}
