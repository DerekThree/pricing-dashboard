import "./styles.css";

import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import type { ColDef } from "ag-grid-community";

import DataTable from "../../components/DataTable";
import PageTopMenu from "../../components/PageTopMenu";
import { getApi, type TableRecord } from "../../utils/apiUtils";
import Layout from "../layout";

const columnDefs: ColDef<TableRecord>[] = [
  { field: "planCode", headerName: "Plan Code" },
  { field: "planName", headerName: "Plan Name" },
  { field: "productCode", headerName: "Product Code" },
  { field: "productName", headerName: "Product Name" },
  { field: "regionCode", headerName: "Region Code" },
  { field: "regionName", headerName: "Region Name" },
  { field: "activeFrom", headerName: "Active From" },
  { field: "activeTo", headerName: "Active To" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function loader() {
  return getApi<TableRecord[]>("/pricing-plans");
}

export default function List() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<TableRecord | null>(null);
  const rowData = useLoaderData<typeof loader>();

  function openCrudPage(action: string) {
    navigate(`/pricing-plans/${action}`, {
      state: { row: selectedRow },
    });
  }

  return (
    <Layout>
      <section className="page">
        <PageTopMenu
          title="Pricing Plans"
          onCreate={() => openCrudPage("create")}
          onView={() => openCrudPage("view")}
          onUpdate={() => openCrudPage("update")}
          onDelete={() => openCrudPage("delete")}
          actionsEnabled={Boolean(selectedRow)}
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
