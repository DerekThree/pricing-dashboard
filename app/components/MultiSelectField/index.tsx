import "../shared/ListTable/styles.css";
import Dropdown from "../Dropdown";
import ListTable from "../shared/ListTable/ListTable";

export type MultiSelectOption = {
  description?: string;
  label: string;
  value: string | number;
};

type MultiSelectFieldProps = {
  disabled?: boolean;
  onAdd(value: string | number): void;
  onRemove(value: string | number): void;
  options: MultiSelectOption[];
  selectedValues: Array<string | number>;
  title: string;
};

type MultiSelectRow = {
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
  const rowData: MultiSelectRow[] = selectedValues.map((value) => {
    const option = options.find((currentOption) => currentOption.value === value);

    return { label: option?.label ?? String(value), value };
  });

  return (
    <div className="selection-list">
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
        columnDefs={[{ field: "label" }]}
        disabled={disabled}
        noRowsText={`No ${title}`}
        onRemove={(row) => onRemove(row.value)}
        rowData={rowData}
        selectable={false}
      />
    </div>
  );
}
