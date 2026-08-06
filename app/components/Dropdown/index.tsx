import "./styles.css";

import Select, { components, type SingleValueProps } from "react-select";
import type { DropdownOption } from "../shared/DropdownOption";

type DropdownProps = {
  disabled: boolean;
  value: string | number | undefined;
  label: string;
  name?: string;
  noOptionsMessage?: string;
  options?: DropdownOption<string | number>[];
  placeholder?: string;
  required?: boolean;  
  onChange(value: any): void;
};

function SingleValue(props: SingleValueProps<DropdownOption<string | number>>) {
  const { data, innerProps } = props;

  const tooltipInnerProps = {
    ...innerProps,
    title: data.description ?? data.label,
  } as SingleValueProps<DropdownOption<string | number>>["innerProps"];

  return <components.SingleValue {...props} innerProps={tooltipInnerProps} />;
}

function formatOptionLabel(option: DropdownOption<string | number>, context: "menu" | "value") {
  return context === "value" || !option.description ? option.label : `${option.description} - ${option.label}`;
}

export default function Dropdown(props: DropdownProps) {
  const { disabled, label, name, options, value } = props;
  const noOptionsMessage = props.noOptionsMessage ?? "No options";
  const placeholder = props.placeholder ?? `Select ${label.toLowerCase()}`;
  const required = props.required === true;
  const selectedOption = options?.find((option) => option.value === value) ?? null;

  return (
    <label className="crud-page-form-field" htmlFor={name}>
      <span>{label}</span>
      <Select
        className="dropdown"
        classNamePrefix="dropdown"
        inputId={name}
        isDisabled={disabled}
        required={required}
        components={{ SingleValue }}
        formatOptionLabel={(option, { context }) => formatOptionLabel(option, context)}
        getOptionLabel={(option) => option.label}
        getOptionValue={(option) => String(option.value)}
        options={options}
        noOptionsMessage={() => noOptionsMessage}
        placeholder={placeholder}
        value={selectedOption}
        onChange={(selected) => props.onChange((selected as DropdownOption<string | number>).value)}
      />
      {name ? <input name={name} type="hidden" value={String(value)} /> : null}
    </label>
  );
}
