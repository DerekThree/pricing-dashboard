import "./styles.css";

import Select, { type MultiValue } from "react-select";

type SelectOption = {
  label: string;
  value: string;
};

type MultiChoiceDropdownProps = {
  disabled: boolean;
  label: string;
  name: string;
  options: string[];
  values: string[];
  onChange(values: string[]): void;
};

export default function MultiChoiceDropdown({
  disabled,
  label,
  name,
  options,
  values,
  onChange,
}: MultiChoiceDropdownProps) {
  const selectOptions: SelectOption[] = options.map((option) => ({
    label: option,
    value: option,
  }));
  const selectedOptions = selectOptions.filter((option) =>
    values.includes(option.value),
  );

  function updateValues(selectedOptions: MultiValue<SelectOption>) {
    onChange(selectedOptions.map((option) => option.value));
  }

  return (
    <label className="crud-page-form-field" htmlFor={name}>
      <span>{label}</span>
      <Select
        className="multi-choice"
        classNamePrefix="multi-choice"
        inputId={name}
        isDisabled={disabled}
        isMulti
        options={selectOptions}
        placeholder={`Add ${label.toLowerCase()}`}
        value={selectedOptions}
        onChange={updateValues}
      />
    </label>
  );
}
