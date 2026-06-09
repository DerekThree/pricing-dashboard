import "./styles.css";
import { useState } from "react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type SelectionChangedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

const defaultColDef = {
  filter: true,
  floatingFilter: true,
  resizable: true,
  sortable: true,
  flex: 1,
};

export default function DataTable<TRow extends object>(props: {
  columnDefs: ColDef<TRow>[];
  rowData: TRow[];
  setSelectedRow?: (row: TRow) => void;
}) {
  const [isTableInitializing, setIsTableInitializing] = useState(true);

  return (
    <div className="data-table">
      {isTableInitializing && (
        <div className="data-table-loading">
          <div className="data-table-spinner" />
        </div>
      )}
      <AgGridReact
        columnDefs={props.columnDefs}
        defaultColDef={defaultColDef}
        noRowsOverlayComponent={() => "No rows"}
        onFirstDataRendered={() => setIsTableInitializing(false)}
        onGridReady={() => {
          if (props.rowData.length === 0) {
            setIsTableInitializing(false);
          }
        }}
        onSelectionChanged={(event: SelectionChangedEvent<TRow>) =>
          props.setSelectedRow?.(event.api.getSelectedRows()[0])
        }
        rowData={props.rowData}
        rowSelection={{ mode: "singleRow", enableClickSelection: true }}
        theme={themeQuartz}
      />
    </div>
  );
}
