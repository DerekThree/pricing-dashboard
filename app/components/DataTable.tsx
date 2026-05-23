import "../styles/dataTable.css";
import { useMemo, useState } from "react";

type DataTableProps = {
  columns: string[];
  onSelectedRowChange?: (row: string[] | null) => void;
  rows: string[][];
};

type SortDirection = "asc" | "desc";

export default function DataTable({
  columns,
  onSelectedRowChange,
  rows,
}: DataTableProps) {
  const [columnFilters, setColumnFilters] = useState<string[]>(
    columns.map(() => ""),
  );
  const [sort, setSort] = useState<{
    columnIndex: number;
    direction: SortDirection;
  } | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const visibleRows = useMemo(() => {
    const filteredRows = rows
      .map((row, rowIndex) => ({ row, rowIndex }))
      .filter(({ row }) =>
        columnFilters.every((filter, columnIndex) =>
          row[columnIndex]
            ?.toLowerCase()
            .includes(filter.trim().toLowerCase()),
        ),
      );

    if (!sort) {
      return filteredRows;
    }

    return [...filteredRows].sort((a, b) => {
      const left = a.row[sort.columnIndex] ?? "";
      const right = b.row[sort.columnIndex] ?? "";
      const result = left.localeCompare(right, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sort.direction === "asc" ? result : -result;
    });
  }, [columnFilters, rows, sort]);

  function updateColumnFilter(columnIndex: number, value: string) {
    setColumnFilters((currentFilters) =>
      currentFilters.map((filter, index) =>
        index === columnIndex ? value : filter,
      ),
    );
  }

  function toggleSort(columnIndex: number) {
    setSort((currentSort) => {
      if (currentSort?.columnIndex !== columnIndex) {
        return { columnIndex, direction: "asc" };
      }

      if (currentSort.direction === "asc") {
        return { columnIndex, direction: "desc" };
      }

      return null;
    });
  }

  function selectRow(rowIndex: number) {
    const nextSelectedRowIndex =
      selectedRowIndex === rowIndex ? null : rowIndex;

    setSelectedRowIndex(nextSelectedRowIndex);
    onSelectedRowChange?.(
      nextSelectedRowIndex === null ? null : rows[nextSelectedRowIndex],
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} className="data-table-header-cell">
              <button
                aria-label={`Sort ${column}`}
                className="data-table-sort-button"
                onClick={() => toggleSort(columns.indexOf(column))}
                type="button"
              >
                {column}
                <span className="data-table-sort-indicator">
                  {sort?.columnIndex === columns.indexOf(column)
                    ? sort.direction === "asc"
                      ? "↑"
                      : "↓"
                    : "↕"}
                </span>
              </button>
            </th>
          ))}
        </tr>
        <tr>
          {columns.map((column, columnIndex) => (
            <th key={`${column}-filter`} className="data-table-filter-cell">
              <input
                aria-label={`Search ${column}`}
                className="data-table-filter-input"
                onChange={(event) =>
                  updateColumnFilter(columnIndex, event.target.value)
                }
                placeholder={`Search ${column}`}
                type="search"
                value={columnFilters[columnIndex] ?? ""}
              />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visibleRows.length > 0 ? (
          visibleRows.map(({ row, rowIndex }) => (
            <tr
              aria-selected={selectedRowIndex === rowIndex}
              key={rowIndex}
              className={`data-table-row ${
                selectedRowIndex === rowIndex ? "data-table-row-selected" : ""
              }`}
              onClick={() => selectRow(rowIndex)}
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="data-table-cell">
                  {cell}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td className="data-table-empty-cell" colSpan={columns.length}>
              No matching rows
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
