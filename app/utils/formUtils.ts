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

export const productTypeOptions = Object.values(ProductType).map((productType) => ({
  value: productType,
  label: productType[0] + productType.slice(1).toLowerCase(),
}));