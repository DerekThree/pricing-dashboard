import { useState } from "react";
import { useNavigate } from "react-router";

import DataTable from "../components/DataTable";
import ListPageTopMenu from "../components/ListPageTopMenu";
import Layout from "./layout";

function RegionContent() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<string[] | null>(null);
  const columns = ["ID", "Name", "States", "Updated", "Updated By"];
  const rows = [
    ["1", "West", "CA,OR,WA", "2026-04-28", "admin"],
    ["2", "East", "NY,NJ,CT", "2026-04-27", "editor"],
  ];

  function openCrudPage(operation: string) {
    if (!selectedRow) {
      return;
    }

    navigate(`/region/crud/${operation}`, {
      state: { columns, row: selectedRow },
    });
  }

  return (
    <section className="page">
      <ListPageTopMenu
        actionsDisabled={!selectedRow}
        title="Region"
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

export default function RegionPage() {
  return (
    <Layout>
      <RegionContent />
    </Layout>
  );
}
