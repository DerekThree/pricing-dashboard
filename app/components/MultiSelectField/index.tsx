import "../shared/ListTable/styles.css";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import Dropdown from "../Dropdown";
import ListTable from "../shared/ListTable/ListTable";
import type { DropdownOption, DropdownValue } from "../Dropdown";

type MultiSelectFieldProps = {
  disabled?: boolean;
  onAdd(value: DropdownValue): void;
  onRemove(value: DropdownValue): void;
  options: DropdownOption[];
  selectedValues: Array<DropdownValue>;
  title: string;
};

export default function MultiSelectField({
  disabled = false,
  onAdd,
  onRemove,
  options,
  selectedValues,
  title,
}: MultiSelectFieldProps) {
  const availableOptions = options.filter((option) => !selectedValues.includes(option.value));

  const columnDefs: ColDef<DropdownOption>[] = [
    {
      field: "label",
      cellRenderer: ({ data }: ICellRendererParams<DropdownOption>) =>
        (
          <div style={{ height: "100%", width: "100%" }} title={data!.description ?? data!.label}>
            {data!.label}
          </div>
        ),
    },
  ];

  const rowData: DropdownOption[] = selectedValues.map((value) => {
    const option = options.find((currentOption) => currentOption.value === value)!;

    return {
      description: option.description,
      label: option.label,
      value,
    };
  });

  return (
    <div className="selection-list selection-list--multi-select">
      {disabled ? (
        <span className="selection-list-title">{title}</span>
      ) : (
        <Dropdown
          label={title}
          value=""
          disabled={availableOptions.length === 0}
          options={availableOptions}
          placeholder={availableOptions.length === 0 ? `No available ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}
          onChange={onAdd}
        />
      )}
      <ListTable
        columnDefs={columnDefs}
        disabled={disabled}
        noRowsText={`No ${title.toLowerCase()}`}
        onRemove={(row) => onRemove(row.value)}
        rowData={rowData}
        selectable={false}
      />
    </div>
  );
}
