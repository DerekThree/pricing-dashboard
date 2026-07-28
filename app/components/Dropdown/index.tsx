import "./styles.css";

import Select, {
  components,
  type MultiValue,
  type MultiValueGenericProps,
  type SingleValueProps,
} from "react-select";

type DropdownValue = string | number;

export type DropdownOption = {
  value: DropdownValue;
  label: string;
  description?: string;
};

type BaseDropdownProps = {
  disabled: boolean;
  label: string;
  name: string;
  noOptionsMessage?: string;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
};

type MultiDropdownProps = BaseDropdownProps & {
  isMulti: true;
  values: DropdownValue[];
  onChange(values: any): void;
};

type SingleDropdownProps = BaseDropdownProps & {
  isMulti?: false;
  value: DropdownValue;
  onChange(value: any): void;
};

type DropdownProps = MultiDropdownProps | SingleDropdownProps;

function MultiValueContainer(props: MultiValueGenericProps<DropdownOption>) {
  const { data, innerProps } = props;

  const tooltipInnerProps = {
    ...innerProps,
    title: data.description ?? data.label,
  } as MultiValueGenericProps<DropdownOption>["innerProps"];

  return <components.MultiValueContainer {...props} innerProps={tooltipInnerProps} />;
}

function SingleValue(props: SingleValueProps<DropdownOption>) {
  const { data, innerProps } = props;

  const tooltipInnerProps = {
    ...innerProps,
    title: data.description ?? data.label,
  } as SingleValueProps<DropdownOption>["innerProps"];

  return <components.SingleValue {...props} innerProps={tooltipInnerProps} />;
}

function formatOptionLabel(option: DropdownOption, context: "menu" | "value", isMulti: boolean) {
  return context === "value" || !option.description ? option.label : `${option.description} - ${option.label}`;
}

function renderHiddenInputs(name: string, selectedValues: DropdownValue[]) {
  return selectedValues.map((value) => <input key={String(value)} name={name} type="hidden" value={value} />);
}

export default function Dropdown(props: DropdownProps) {
  const { disabled, label, name, options } = props;
  const isMulti = props.isMulti === true;
  const noOptionsMessage = props.noOptionsMessage ?? "No options";
  const placeholder = props.placeholder ?? `${isMulti ? "Add" : "Select"} ${label.toLowerCase()}`;
  const required = props.required === true;
  const selectedValues = isMulti ? props.values : [props.value];
  const selectedOption = isMulti
    ? options.filter((option) => props.values.includes(option.value))
    : options.find((option) => option.value === props.value) ?? null;

  return (
    <label className="crud-page-form-field" htmlFor={name}>
      <span>{label}</span>
      <Select
        className="dropdown"
        classNamePrefix="dropdown"
        inputId={name}
        isDisabled={disabled}
        isMulti={isMulti}
        required={required}
        components={isMulti ? { MultiValueContainer } : { SingleValue }}
        formatOptionLabel={(option, { context }) => formatOptionLabel(option, context, isMulti)}
        getOptionLabel={(option) => option.label}
        getOptionValue={(option) => String(option.value)}
        options={options}
        noOptionsMessage={() => noOptionsMessage}
        placeholder={placeholder}
        value={selectedOption}
        onChange={(selected) => {
          if (isMulti) {
            props.onChange((selected as MultiValue<DropdownOption>).map((option) => option.value));
          } else {
            props.onChange((selected as DropdownOption).value);
          }
        }}
      />
      {renderHiddenInputs(name, selectedValues)}
    </label>
  );
}
