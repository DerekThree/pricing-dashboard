import "./styles.css";
import "../shared/ListTable/styles.css";

import { useState } from "react";
import type { ColDef, IRowNode, RowDataUpdatedEvent, SelectionChangedEvent } from "ag-grid-community";

import ListTable from "../shared/ListTable/ListTable";

type EditableListFieldProps<TRow extends object> = {
  hideButtons?: boolean;
  columnDefs: ColDef<TRow>[];
  disabled?: boolean;
  onAdd(): TRow | void;
  onRemove(row: TRow): void;
  onSelectionChanged?(row: TRow | null): void;
  rowData: TRow[];
  title: string;
};

export default function EditableListField<TRow extends object>({
  hideButtons = false,
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
    event.api.forEachNode((node: IRowNode<TRow>) => node.setSelected(node.data === selectedRow));
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
        {!disabled && !hideButtons && <button
          className="selection-list-add-button"
          type="button"
          onClick={handleAdd}
        >
          Add
        </button>}
      </div>
      <ListTable
        hideButtons={hideButtons}
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
