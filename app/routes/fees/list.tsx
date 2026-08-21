import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listFees } from "../../generated/api/client";
import { FeeType, type FeeListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { dateTimeFormatter, productTypesFormatter } from "../../utils/valueFormatters";
import { feeTypeLabels } from "./feeTypeLabels";

const columnDefs: ColDef<FeeListItem>[] = [
  { field: "fee", headerName: "Fee" },
  {
    field: "feeType",
    headerName: "Fee Type",
    valueFormatter: ({ value }) => feeTypeLabels[value as FeeType],
  },
  {
    field: "productTypes",
    headerName: "Product Types",
    valueFormatter: productTypesFormatter,
  },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: dateTimeFormatter },
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
