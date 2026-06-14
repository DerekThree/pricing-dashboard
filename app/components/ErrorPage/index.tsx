import "./styles.css";

import { useNavigate } from "react-router";

import PageTopMenu from "../PageTopMenu";

type ErrorPageProps = {
  stack?: string;
  status: string;
  statusText: string;
};

export default function ErrorPage({
  stack,
  status,
  statusText,
}: ErrorPageProps) {
  const navigate = useNavigate();

  return (
    <section className="page">
      <PageTopMenu
        title="Error"
        actions={[
          {
            label: "Try again",
            onClick: () => window.location.reload(),
          },      
          {
            label: "Home",
            onClick: () => navigate("/"),
            variant: "cancel",
          },              
          {
            label: "Back",
            onClick: () => navigate(-1),
            variant: "cancel",
          },
        ]}
      />
      <div className="error-page">
        <h2 className="error-status">{status}</h2>
        <p className="error-message">{statusText}</p>
        {import.meta.env.DEV && stack && (
          <details className="error-details">
            <summary>Technical details</summary>
            <pre>
              <code>{stack}</code>
            </pre>
          </details>
        )}
      </div>
    </section>
  );
}
