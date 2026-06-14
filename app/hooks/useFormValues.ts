import { useState } from "react";

export default function useFormValues<TValues extends Record<string, string>>(
  initialValues: TValues,
) {
  const [formValues, setFormValues] = useState(initialValues);

  function updateField(field: keyof TValues, value: string) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  return { formValues, updateField };
}
