import type { KeyboardEvent } from "react";

export function preventEnterSubmit(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key === "Enter") {
    event.preventDefault();
  }
}
