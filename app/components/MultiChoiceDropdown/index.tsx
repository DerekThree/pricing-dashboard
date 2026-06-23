import "./styles.css";

import Select, { components, type MultiValueGenericProps } from "react-select";

export type MultiChoiceDropdownOption = {
  label?: string;
  tooltip?: string;
  value: string;
};

type MultiChoiceDropdownProps = {
  disabled: boolean;
  label: string;
  name: string;
  options: MultiChoiceDropdownOption[];
  values: string[];
  onChange(values: string[]): void;
};

function MultiValueContainer(props: MultiValueGenericProps<MultiChoiceDropdownOption>) {
  const { data, innerProps } = props;

  if (!data.tooltip) {
    return <components.MultiValueContainer {...props} />;
  }

  const tooltipInnerProps = {
    ...innerProps,
    className: `${innerProps.className ?? ""} tooltip-balloon multi-choice-tooltip`,
    "data-tooltip": data.tooltip,
  } as MultiValueGenericProps<MultiChoiceDropdownOption>["innerProps"];

  return <components.MultiValueContainer {...props} innerProps={tooltipInnerProps} />;
}

export default function MultiChoiceDropdown({
  disabled,
  label,
  name,
  options,
  values,
  onChange,
}: MultiChoiceDropdownProps) {
  const selectedOptions = options.filter((option) => values.includes(option.value),);

  return (
    <label className="crud-page-form-field" htmlFor={name}>
      <span>{label}</span>
      <Select
        className="multi-choice"
        classNamePrefix="multi-choice"
        inputId={name}
        isDisabled={disabled}
        isMulti
        components={{ MultiValueContainer }}
        formatOptionLabel={(option, { context }) =>
          context === "menu" && option.label ? option.label : option.value
        }
        options={options}
        placeholder={`Add ${label.toLowerCase()}`}
        value={selectedOptions}
        onChange={(opts) => onChange(opts.map((opt) => opt.value))}
      />
    </label>
  );
}
