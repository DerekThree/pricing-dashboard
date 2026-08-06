export type DropdownOption<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
};
