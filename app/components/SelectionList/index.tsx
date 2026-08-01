import "./styles.css";

import { useEffect, useState } from "react";
import {
  AllCommunityModule,
  type ICellRendererParams,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type SelectionChangedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

type SelectionListProps<TRow extends object> = {
  columnDefs: ColDef<TRow>[];
  disabled?: boolean;
  onAdd(): TRow;
  onRemove?(row: TRow): void;
  onSelectionChanged?(row: TRow | null): void;
  rowData: TRow[];
  title: string;
};

export default function SelectionList<TRow extends object>({
  columnDefs,
  disabled = false,
  onAdd,
  onRemove,
  onSelectionChanged,
  rowData,
  title,
}: SelectionListProps<TRow>) {
  const [selectedRow, setSelectedRow] = useState<TRow | null>(null);

  const removeButtonColumnDef: ColDef<TRow> = {
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
    maxWidth: 32,
  };
  const resolvedColumnDefs = onRemove ? [ ...columnDefs, removeButtonColumnDef ] : columnDefs;
  
  useEffect(() => {
    if (selectedRow && !rowData.includes(selectedRow)) {
      setSelectedRow(null);
      return;
    }

    onSelectionChanged?.(selectedRow);
  }, [onSelectionChanged, rowData, selectedRow]);

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

  function handleSelectionChanged(event: SelectionChangedEvent<TRow>) {
    if (disabled) {
      return;
    }

    const selectedRow = event.api.getSelectedRows()[0];

    if (selectedRow) {
      setSelectedRow(selectedRow);
    }
  }

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
          defaultColDef={{ minWidth: 0, flex: 1 }}
          domLayout="autoHeight"
          headerHeight={0}
          onRowDataUpdated={(event) =>
            event.api.forEachNode((node) => node.setSelected(node.data === selectedRow))
          }
          onSelectionChanged={handleSelectionChanged}
          rowData={rowData}
          rowHeight={20}
          rowSelection={{ mode: "singleRow", enableClickSelection: !disabled, checkboxes: false }}
          suppressCellFocus
          suppressHorizontalScroll
          suppressNoRowsOverlay
          theme={themeQuartz}
        />
      </div>
    </div>
  );
}
