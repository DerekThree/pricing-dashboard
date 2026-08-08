import "../shared/ListTable/styles.css";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import Dropdown from "../Dropdown";
import ListTable from "../shared/ListTable/ListTable";
import type { DropdownOption } from "../shared/DropdownOption";

type MultiSelectFieldProps = {
  disabled?: boolean;
  onAdd(value: string | number): void;
  onRemove(value: string | number): void;
  options: DropdownOption<string | number>[];
  selectedValues: Array<string | number>;
  title: string;
};

type MultiSelectRow = {
  description?: string;
  label: string;
  value: string | number;
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

  const columnDefs: ColDef<MultiSelectRow>[] = [
    {
      field: "label",
      cellRenderer: ({ data }: ICellRendererParams<MultiSelectRow>) =>
        (
          <div style={{ height: "100%", width: "100%" }} title={data!.description ?? data!.label}>
            {data!.label}
          </div>
        ),
    },
  ];

  const rowData: MultiSelectRow[] = selectedValues.map((value) => {
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
          disabled={availableOptions.length === 0}
          label={title}
          placeholder={availableOptions.length === 0 ? `No available ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}
          options={availableOptions}
          value=""
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
