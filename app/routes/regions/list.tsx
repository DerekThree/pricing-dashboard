import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { getApi } from "../../utils/apiUtils";

type RegionRow = {
  id: number;
  regionCode: string;
  regionName: string;
  states: string;
  zipCodes: string;
  branches: string;
  updatedOn: string;
  updatedBy: string;
};

const columnDefs: ColDef<RegionRow>[] = [
  { field: "regionCode", headerName: "Region Code" },
  { field: "regionName", headerName: "Region Name" },
  { field: "states", headerName: "States" },
  { field: "zipCodes", headerName: "Zip Codes" },
  { field: "branches", headerName: "Branches" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function loader() {
  return getApi<RegionRow[]>("/regions");
}

export default function RegionList() {
  const rowData = useLoaderData<typeof loader>();

  return (
    <ListPage
      title="Regions"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl="/regions"
    />
  );
}
