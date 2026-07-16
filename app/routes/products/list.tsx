import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listProducts } from "../../generated/api/client";
import { AccountType, type Product } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { formatDateTime } from "../../utils/dateTimeUtils";

const accountTypeLabels: Record<Product["accountType"], string> = {
  [AccountType.DEPOSIT]: "Deposit",
  [AccountType.CREDIT]: "Credit",
};

const columnDefs: ColDef<Product>[] = [
  { field: "productCode", headerName: "Product Code" },
  { field: "productName", headerName: "Product Name" },
  {
    field: "accountType",
    headerName: "Account Type",
    valueFormatter: ({ value }) => accountTypeLabels[value as Product["accountType"]] ?? value,
  },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: ({ value }) => formatDateTime(value) },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listProducts();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as Product[], loaderError: getErrorMessage(data, status) };
}

export default function ProductsPage() {
  const { rowData, loaderError } = useLoaderData<typeof clientLoader>();

  return (
    <ListPage
      title="Products"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.products}
      loaderError={loaderError}
    />
  );
}
