import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listRegions } from "../../generated/api/client";
import type { Region } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { formatDateTime } from "../../utils/dateTimeUtils";

const columnDefs: ColDef<Region>[] = [
  { field: "regionCode", headerName: "Region Code" },
  { field: "regionName", headerName: "Region Name" },
  { field: "states", headerName: "States" },
  { field: "zipCodes", headerName: "Zip Codes" },
  { field: "branches", headerName: "Branches" },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: ({ value }) => formatDateTime(value) },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listRegions();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as Region[], loaderError: getErrorMessage(data, status) };
}

export default function RegionsPage() {
  const { rowData, loaderError } = useLoaderData<typeof clientLoader>();

  return (
    <ListPage
      title="Regions"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.regions}
      loaderError={loaderError}
    />
  );
}
