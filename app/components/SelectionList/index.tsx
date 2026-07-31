import "./styles.css";

import { useEffect, useState } from "react";
import {
  AllCommunityModule,
  type ICellRendererParams,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

type SelectionListProps<TRow extends object> = {
  columnDefs: ColDef<TRow>[];
  disabled?: boolean;
  onAdd(): TRow;
  onRemove?(row: TRow): void;
  onSelectionChange?(row: TRow | null): void;
  rowData: TRow[];
  title: string;
};

export default function SelectionList<TRow extends object>({
  columnDefs,
  disabled = false,
  onAdd,
  onRemove,
  onSelectionChange,
  rowData,
  title,
}: SelectionListProps<TRow>) {
  const [selectedRow, setSelectedRow] = useState<TRow | null>(null);

  useEffect(() => {
    if (selectedRow && !rowData.includes(selectedRow)) {
      setSelectedRow(null);
      return;
    }

    onSelectionChange?.(selectedRow);
  }, [onSelectionChange, rowData, selectedRow]);

  function handleAdd() {
    const newRow = onAdd();
    setSelectedRow(newRow);
  }

  function handleRemove(row: TRow) {
    if (row === selectedRow) {
      setSelectedRow(null);
    }

    onRemove?.(row);
  }

  const resolvedColumnDefs = onRemove
    ? [
        ...columnDefs,
        {
          cellRenderer: (params: ICellRendererParams<TRow>) => (
            <button
              className="selection-list-remove-button"
              disabled={disabled}
              type="button"
              onClick={() => { if (params.node.data) { handleRemove(params.node.data); } }}
            >
              X
            </button>
          ),
          colId: "remove",
          maxWidth: 32,
          minWidth: 32,
          resizable: false,
          sortable: false,
          width: 32,
        } satisfies ColDef<TRow>,
      ]
    : columnDefs;

  return (
    <div className="selection-list">
      <div className="selection-list-header">
        <span className="selection-list-title">{title}</span>
        <button
          className="selection-list-add-button"
          disabled={disabled}
          type="button"
          onClick={handleAdd}
        >
          Add
        </button>
      </div>
      <div className={`selection-list-table ${rowData.length === 0 ? "selection-list-table-empty" : ""}`}>
        <AgGridReact
          columnDefs={resolvedColumnDefs}
          domLayout="autoHeight"
          headerHeight={0}
          onGridReady={(event) => event.api.sizeColumnsToFit()}
          onGridSizeChanged={(event) => event.api.sizeColumnsToFit()}
          onRowDataUpdated={(event) =>
            event.api.forEachNode((node) => node.setSelected(node.data === selectedRow))
          }
          onSelectionChanged={(event) => {
            const selectedRow = event.api.getSelectedRows()[0];

            if (selectedRow) {
              setSelectedRow(selectedRow);
            }
          }}
          rowData={rowData}
          rowHeight={20}
          rowSelection={{ mode: "singleRow", enableClickSelection: true, checkboxes: false }}
          suppressCellFocus
          suppressHorizontalScroll
          suppressNoRowsOverlay
          theme={themeQuartz}
        />
      </div>
    </div>
  );
}
