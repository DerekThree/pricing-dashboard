import { ProductType } from "../../generated/api/models/productType";

export const productTypeLabels: Record<ProductType, string> = {
  [ProductType.DEPOSIT]: "Standard Deposit",
  [ProductType.CD]: "Certificate of Deposit",
  [ProductType.CREDIT]: "Credit",
};

export const productTypeOptions = Object.values(ProductType).map((productType) => ({
  value: productType,
  label: productTypeLabels[productType],
}));
