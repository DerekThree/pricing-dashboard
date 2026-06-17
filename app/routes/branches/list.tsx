import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listBranches } from "../../generated/api/client";
import type { Branch } from "../../generated/api/models";
import { routeUrls } from "../../routes";

const columnDefs: ColDef<Branch>[] = [
  { field: "branchCode", headerName: "Branch Code" },
  { field: "branchName", headerName: "Branch Name" },
  { field: "state", headerName: "State" },
  { field: "zipCode", headerName: "Zip Code" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function loader() {
  const response = await listBranches();

  return response.data;
}

export default function BranchesPage() {
  const rowData = useLoaderData<typeof loader>();

  return (
    <ListPage
      title="Branches"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.branches}
    />
  );
}
