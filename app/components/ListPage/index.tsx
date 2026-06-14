import { useState } from "react";
import { useNavigate } from "react-router";
import type { ColDef } from "ag-grid-community";

import DataTable from "../DataTable";
import PageTopMenu from "../PageTopMenu";

type ListPageProps<TRow extends { id: number }> = {
  title: string;
  columnDefs: ColDef<TRow>[];
  rowData: TRow[];
  crudRouteUrl: string;
};

export default function ListPage<TRow extends { id: number }>({
  title,
  columnDefs,
  rowData,
  crudRouteUrl,
}: ListPageProps<TRow>) {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<TRow>();

  return (
    <section className="page">
      <PageTopMenu
        title={title}
        actions={[
          {
            label: "Create",
            onClick: () => navigate(`${crudRouteUrl}/create`),
          },
          {
            label: "View",
            onClick: () =>
              navigate(`${crudRouteUrl}/view/${selectedRow?.id}`),
            disabled: !selectedRow,
          },
          {
            label: "Update",
            onClick: () =>
              navigate(`${crudRouteUrl}/update/${selectedRow?.id}`),
            disabled: !selectedRow,
          },
          {
            label: "Delete",
            onClick: () =>
              navigate(`${crudRouteUrl}/delete/${selectedRow?.id}`),
            disabled: !selectedRow,
          },
        ]}
      />
      <DataTable
        columnDefs={columnDefs}
        rowData={rowData}
        setSelectedRow={setSelectedRow}
      />
    </section>
  );
}
