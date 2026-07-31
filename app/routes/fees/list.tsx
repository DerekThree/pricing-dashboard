import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listFees } from "../../generated/api/client";
import { ProductType } from "../../generated/api/models";
import type { FeeListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { formatDateTime } from "../../utils/dateTimeUtils";

const productTypeLabels: Record<FeeListItem["productType"], string> = {
  [ProductType.DEPOSIT]: "Deposit",
  [ProductType.CREDIT]: "Credit",
};

const columnDefs: ColDef<FeeListItem>[] = [
  { field: "fee", headerName: "Fee" },
  {
    field: "productType",
    headerName: "Product Type",
    valueFormatter: ({ value }) => productTypeLabels[value as FeeListItem["productType"]] ?? value,
  },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: ({ value }) => formatDateTime(value) },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listFees();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as FeeListItem[], loaderError: getErrorMessage(data, status) };
}

export default function FeesPage() {
  const { rowData, loaderError } = useLoaderData<typeof clientLoader>();

  return (
    <ListPage
      title="Fees"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.fees}
      loaderError={loaderError}
    />
  );
}
