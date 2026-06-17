import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listRegions } from "../../generated/api/client";
import type { Region } from "../../generated/api/models";
import { routeUrls } from "../../routes";

const columnDefs: ColDef<Region>[] = [
  { field: "regionCode", headerName: "Region Code" },
  { field: "regionName", headerName: "Region Name" },
  { field: "states", headerName: "States" },
  { field: "zipCodes", headerName: "Zip Codes" },
  { field: "branches", headerName: "Branches" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function loader() {
  const response = await listRegions();

  return response.data;
}

export default function RegionsPage() {
  const rowData = useLoaderData<typeof loader>();

  return (
    <ListPage
      title="Regions"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.regions}
    />
  );
}
