import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listProducts } from "../../generated/api/client";
import { AccountType, type ProductListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { formatDateTime } from "../../utils/dateTimeUtils";

const accountTypeLabels: Record<ProductListItem["accountType"], string> = {
  [AccountType.DEPOSIT]: "Deposit",
  [AccountType.CREDIT]: "Credit",
};

const columnDefs: ColDef<ProductListItem>[] = [
  { field: "product", headerName: "Product" },
  {
    field: "accountType",
    headerName: "Account Type",
    valueFormatter: ({ value }) => accountTypeLabels[value as ProductListItem["accountType"]] ?? value,
  },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: ({ value }) => formatDateTime(value) },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listProducts();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as ProductListItem[], loaderError: getErrorMessage(data, status) };
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
