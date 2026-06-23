import type { KeyboardEvent } from "react";

export function preventTextInputSubmit(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
    event.preventDefault();
  }
}
