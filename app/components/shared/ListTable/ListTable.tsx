import "./styles.css";

import {
  AllCommunityModule,
  type ColDef,
  type ICellRendererParams,
  ModuleRegistry,
  type RowDataUpdatedEvent,
  type SelectionChangedEvent,
  themeQuartz,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

type ListTableProps<TRow extends object> = {
  columnDefs: ColDef<TRow>[];
  disabled?: boolean;
  noRowsText: string;
  onRemove(row: TRow): void;
  onRowDataUpdated?(event: RowDataUpdatedEvent<TRow>): void;
  onSelectionChanged?(event: SelectionChangedEvent<TRow>): void;
  rowData: TRow[];
  selectable?: boolean;
};

export default function ListTable<TRow extends object>({
  columnDefs,
  disabled = false,
  noRowsText,
  onRemove,
  onRowDataUpdated,
  onSelectionChanged,
  rowData,
  selectable = false,
}: ListTableProps<TRow>) {
  const removeButtonColumnDef: ColDef<TRow> = {
    cellRenderer: (params: ICellRendererParams<TRow>) => (
      <button
        className="selection-list-remove-button"
        disabled={disabled}
        type="button"
        onClick={() => params.node.data && onRemove(params.node.data)}
      >
        X
      </button>
    ),
    maxWidth: 32,
  };

  return (
    <div className="selection-list-table">
      <AgGridReact
        columnDefs={[...columnDefs, removeButtonColumnDef]}
        defaultColDef={{ minWidth: 0, flex: 1 }}
        domLayout="autoHeight"
        headerHeight={0}
        noRowsOverlayComponent={() => noRowsText}
        onRowDataUpdated={onRowDataUpdated}
        onSelectionChanged={onSelectionChanged}
        rowData={rowData}
        rowHeight={20}
        rowSelection={{ mode: "singleRow", enableClickSelection: selectable, checkboxes: false }}
        suppressCellFocus
        suppressHorizontalScroll
        suppressRowHoverHighlight={!selectable}
        theme={themeQuartz}
      />
    </div>
  );
}
