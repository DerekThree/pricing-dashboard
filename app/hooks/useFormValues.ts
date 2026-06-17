import { useState } from "react";

export default function useFormValues<TValues extends object>(
  initialValues: TValues,
) {
  const [formValues, setFormValues] = useState(initialValues);

  function updateField<TField extends keyof TValues>(
    field: TField,
    value: TValues[TField],
  ) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  return { formValues, updateField };
}
