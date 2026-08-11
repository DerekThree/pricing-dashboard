type Toast = {
  id: number;
  message: string;
};

let nextToastId = 0;
let toast: Toast | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function showToast(message: string) {
  toast = { id: ++nextToastId, message };
  notify();
}

export function getToast() {
  return toast;
}

export function subscribeToast(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearToast(id: number) {
  if (toast?.id !== id) {
    return;
  }

  toast = null;
  notify();
}
