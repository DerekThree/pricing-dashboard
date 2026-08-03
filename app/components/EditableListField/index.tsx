import "./styles.css";
import "../shared/ListTable/styles.css";

import { useState } from "react";
import type { ColDef, RowDataUpdatedEvent, SelectionChangedEvent } from "ag-grid-community";

import ListTable from "../shared/ListTable/ListTable";

type EditableListFieldProps<TRow extends object> = {
  columnDefs: ColDef<TRow>[];
  disabled?: boolean;
  onAdd(): TRow | void;
  onRemove(row: TRow): void;
  onSelectionChanged?(row: TRow | null): void;
  rowData: TRow[];
  title: string;
};

export default function EditableListField<TRow extends object>({
  columnDefs,
  disabled = false,
  onAdd,
  onRemove,
  onSelectionChanged,
  rowData,
  title,
}: EditableListFieldProps<TRow>) {
  const [selectedRow, setSelectedRow] = useState<TRow | null>(null);
  const selectable = !!onSelectionChanged && !disabled;

  function handleAdd() {
    const newRow = onAdd();
    newRow && setSelectedRow(newRow);
  }

  function handleRowDataUpdated(event: RowDataUpdatedEvent<TRow>) {
    event.api.forEachNode((node: any) => node.setSelected(node.data === selectedRow));
  }

  function handleSelectionChanged(event: SelectionChangedEvent<TRow>) {
    const selectedRow = event.api.getSelectedRows()[0];
    setSelectedRow(selectedRow);
    selectedRow && onSelectionChanged?.(selectedRow);
  }

  return (
    <div className="selection-list">
      <div className="selection-list-header">
        <span className="selection-list-title">{title}</span>
        {!disabled && <button
          className="selection-list-add-button"
          disabled={disabled}
          type="button"
          onClick={handleAdd}
        >
          Add
        </button>}
      </div>
      <ListTable
        columnDefs={columnDefs}
        disabled={disabled}
        noRowsText={`No ${title.toLowerCase()}`}
        onRemove={onRemove}
        onRowDataUpdated={handleRowDataUpdated}
        onSelectionChanged={handleSelectionChanged}
        rowData={rowData}
        selectable={selectable}
      />
    </div>
  );
}
