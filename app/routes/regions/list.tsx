import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listRegions } from "../../generated/api/client";
import type { RegionListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { dateTimeFormatter } from "../../utils/valueFormatters";

const columnDefs: ColDef<RegionListItem>[] = [
  { field: "region", headerName: "Region" },
  { field: "states", headerName: "States" },
  { field: "zipCodes", headerName: "Zip Codes" },
  { field: "branches", headerName: "Branches" },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: dateTimeFormatter },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listRegions();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as RegionListItem[], loaderError: getErrorMessage(data, status) };
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
