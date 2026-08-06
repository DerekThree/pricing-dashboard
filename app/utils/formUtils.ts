import { ProductType } from "../generated/api/models/productType";

type IdNameCodeOption = {
  id: number;
  name: string;
  code: string;
};

type DropdownOption = {
  value: string | number;
  label: string;
  description?: string;
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

export function toDropdownOption(option: IdNameCodeOption | string) {
  return typeof option === "string"
    ? { value: option, label: option } as DropdownOption
    : { value: option.id, label: option.name, description: option.code } as DropdownOption;
}

export const productTypeLabels: Record<ProductType, string> = {
  [ProductType.DEPOSIT]: "Standard Deposit",
  [ProductType.CD]: "Certificate of Deposit",
  [ProductType.CREDIT]: "Credit",
};

export const productTypeOptions = Object.values(ProductType).map((productType) => ({
  value: productType,
  label: productTypeLabels[productType],
}));
