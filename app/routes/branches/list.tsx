import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { getApi } from "../../utils/apiUtils";

type BranchRow = {
  id: number;
  branchCode: string;
  branchName: string;
  state: string;
  zipCode: string;
  updatedOn: string;
  updatedBy: string;
};

const columnDefs: ColDef<BranchRow>[] = [
  { field: "branchCode", headerName: "Branch Code" },
  { field: "branchName", headerName: "Branch Name" },
  { field: "state", headerName: "State" },
  { field: "zipCode", headerName: "Zip Code" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function loader() {
  return getApi<BranchRow[]>("/branches");
}

export default function BranchList() {
  const rowData = useLoaderData<typeof loader>();

  return (
    <ListPage
      title="Branches"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl="/branches"
    />
  );
}
