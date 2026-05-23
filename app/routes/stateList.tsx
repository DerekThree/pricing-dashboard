import { useState } from "react";
import { useNavigate } from "react-router";

import DataTable from "../components/DataTable";
import ListPageTopMenu from "../components/ListPageTopMenu";
import Layout from "./layout";

function StateContent() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<string[] | null>(null);
  const columns = ["ID", "Abbreviation", "Name", "Updated", "Updated By"];
  const rows = [
    ["1", "CA", "California", "2026-04-30", "admin"],
    ["2", "NY", "New York", "2026-04-29", "editor"],
  ];

  function openCrudPage(operation: string) {
    if (!selectedRow) {
      return;
    }

    navigate(`/state/crud/${operation}`, {
      state: { columns, row: selectedRow },
    });
  }

  return (
    <section className="page">
      <ListPageTopMenu
        actionsDisabled={!selectedRow}
        title="State"
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

export default function StatePage() {
  return (
    <Layout>
      <StateContent />
    </Layout>
  );
}
