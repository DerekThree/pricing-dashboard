import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import ErrorPage from "./components/ErrorPage";
import AppLayout from "./routes/layout";
import { ApiError } from "./utils/apiUtils";
import "./app.css";

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status = "Error";
  let statusText = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = String(error.status);
    statusText =
      getString(error.data) ??
      (error.status === 404
        ? "The requested page could not be found."
        : error.statusText || statusText);
  } else if (error instanceof ApiError) {
    status = String(error.status);
    statusText = error.message;
    stack = import.meta.env.DEV ? error.stack : undefined;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    statusText = error.message;
    stack = error.stack;
  }

  return (
    <AppLayout>
      <ErrorPage stack={stack} status={status} statusText={statusText} />
    </AppLayout>
  );
}
