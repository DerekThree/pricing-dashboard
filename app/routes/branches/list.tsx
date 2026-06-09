import "./styles.css";

import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import type { ColDef } from "ag-grid-community";

import DataTable from "../../components/DataTable";
import PageTopMenu from "../../components/PageTopMenu";
import { getApi } from "../../utils/apiUtils";
import Layout from "../layout";

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

export default function List() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<BranchRow>();
  const rowData = useLoaderData<typeof loader>();

  function openCrudPage(action: string) {
    if (action === "create") {
      navigate("/branches/create");
    } else if (selectedRow) {
      navigate(`/branches/${action}/${selectedRow.id}`);
    }
  }

  return (
    <Layout>
      <section className="page">
        <PageTopMenu
          title="Branches"
          onCreate={() => openCrudPage("create")}
          onView={() => openCrudPage("view")}
          onUpdate={() => openCrudPage("update")}
          onDelete={() => openCrudPage("delete")}
          actionsEnabled={!!selectedRow}
        />
        <DataTable
          columnDefs={columnDefs}
          rowData={rowData}
          setSelectedRow={setSelectedRow}
        />
      </section>
    </Layout>
  );
}
