import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listBranches } from "../../generated/api/client";
import type { BranchListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { formatDateTime } from "../../utils/dateTimeUtils";

const columnDefs: ColDef<BranchListItem>[] = [
  { field: "branch", headerName: "Branch" },
  { field: "state", headerName: "State" },
  { field: "zipCode", headerName: "Zip Code" },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: ({ value }) => formatDateTime(value) },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listBranches();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as BranchListItem[], loaderError: getErrorMessage(data, status) };
}

export default function BranchesPage() {
  const { rowData, loaderError } = useLoaderData<typeof clientLoader>();

  return (
    <ListPage
      title="Branches"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.branches}
      loaderError={loaderError}
    />
  );
}
