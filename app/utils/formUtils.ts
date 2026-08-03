import { ProductType } from "../generated/api/models/productType";

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

export const productTypeLabels: Record<ProductType, string> = {
  [ProductType.DEPOSIT]: "Standard Deposit",
  [ProductType.CD]: "Certificate of Deposit",
  [ProductType.CREDIT]: "Credit",
};

export const productTypeOptions = Object.values(ProductType).map((productType) => ({
  value: productType,
  label: productTypeLabels[productType],
}));
