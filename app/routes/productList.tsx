import { useState } from "react";
import { useNavigate } from "react-router";

import DataTable from "../components/DataTable";
import ListPageTopMenu from "../components/ListPageTopMenu";
import Layout from "./layout";

function ProductContent() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<string[] | null>(null);
  const columns = [
    "ID",
    "Name",
    "Regions",
    "States",
    "Fee",
    "Rate",
    "Updated",
    "Updated By",
  ];
  const rows = [
    ["1", "Basic", "West", "CA,OR", "$10", "1.2%", "2026-04-28", "admin"],
    ["2", "Pro", "East", "NY,NJ", "$20", "1.5%", "2026-04-27", "editor"],
  ];

  function openCrudPage(operation: string) {
    if (!selectedRow) {
      return;
    }

    navigate(`/product/crud/${operation}`, {
      state: { columns, row: selectedRow },
    });
  }

  return (
    <section className="page">
      <ListPageTopMenu
        actionsDisabled={!selectedRow}
        title="Product"
        onCreate={() => openCrudPage("create")}
        onView={() => openCrudPage("view")}
        onEdit={() => openCrudPage("edit")}
        onDelete={() => openCrudPage("delete")}
      />
      <DataTable
        columns={columns}
        onSelectedRowChange={setSelectedRow}
        rows={rows}
      />
    </section>
  );
}

export default function ProductPage() {
  return (
    <Layout>
      <ProductContent />
    </Layout>
  );
}
