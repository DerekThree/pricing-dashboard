import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listBranches } from "../../generated/api/client";
import type { Branch } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";

const columnDefs: ColDef<Branch>[] = [
  { field: "branchCode", headerName: "Branch Code" },
  { field: "branchName", headerName: "Branch Name" },
  { field: "state", headerName: "State" },
  { field: "zipCode", headerName: "Zip Code" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const response = await listBranches();
  const status: number = response.status;

  if (status === 200) {
    return { rowData: response.data, loaderError: null };
  }

  return { rowData: [] as Branch[], loaderError: getErrorMessage(response.data, status) };
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
