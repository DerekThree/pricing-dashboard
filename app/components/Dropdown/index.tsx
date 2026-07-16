import "./styles.css";

import Select, { components, type MultiValue, type MultiValueGenericProps } from "react-select";

export type DropdownOption = {
  label?: string;
  tooltip?: string;
  value: string;
};

type BaseDropdownProps = {
  disabled: boolean;
  label: string;
  name: string;
  options: DropdownOption[];
};

type MultiDropdownProps = BaseDropdownProps & {
  isMulti: true;
  values: string[];
  onChange(values: string[]): void;
};

type SingleDropdownProps = BaseDropdownProps & {
  isMulti?: false;
  value: string;
  onChange(value: string): void;
};

type DropdownProps = MultiDropdownProps | SingleDropdownProps;

function MultiValueContainer(props: MultiValueGenericProps<DropdownOption>) {
  const { data, innerProps } = props;

  if (!data.tooltip) {
    return <components.MultiValueContainer {...props} />;
  }

  const tooltipInnerProps = {
    ...innerProps,
    title: data.tooltip,
  } as MultiValueGenericProps<DropdownOption>["innerProps"];

  return <components.MultiValueContainer {...props} innerProps={tooltipInnerProps} />;
}

function formatOptionLabel(option: DropdownOption, context: "menu" | "value", isMulti: boolean) {
  const isMultiValueDisplay = isMulti && context === "value";
  return isMultiValueDisplay || !option.label ? option.value : option.label;
}

function renderHiddenInputs(name: string, selectedValues: string[]) {
  return selectedValues.map((value) => <input key={value} name={name} type="hidden" value={value} />);
}

export default function Dropdown(props: DropdownProps) {
  const { disabled, label, name, options } = props;
  const isMulti = props.isMulti === true;
  const selectedValues = isMulti ? props.values : [props.value];
  const selectedOption = isMulti
    ? options.filter((option) => props.values.includes(option.value))
    : options.find((option) => option.value === props.value) ?? null;

  return (
    <label className="crud-page-form-field" htmlFor={name}>
      <span>{label}</span>
      {renderHiddenInputs(name, selectedValues)}
      <Select
        className="dropdown"
        classNamePrefix="dropdown"
        inputId={name}
        isDisabled={disabled}
        isMulti={isMulti}
        components={isMulti ? { MultiValueContainer } : undefined}
        formatOptionLabel={(option, { context }) => formatOptionLabel(option, context, isMulti)}
        options={options}
        placeholder={`${isMulti ? "Add" : "Select"} ${label.toLowerCase()}`}
        value={selectedOption}
        onChange={(selected) => {
          if (isMulti) {
            props.onChange((selected as MultiValue<DropdownOption>).map((option) => option.value));
          } else {
            props.onChange((selected as DropdownOption).value);
          }
        }}
      />
    </label>
  );
}
