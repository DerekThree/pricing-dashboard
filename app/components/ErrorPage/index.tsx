import "./styles.css";

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
  return (
    <section className="error-page">
      <div className="error-panel">
        <h2 className="error-status">{status}</h2>
        <p className="error-message">{statusText}</p>
        <div className="error-actions">
          <button
            className="error-action"
            onClick={() => window.history.back()}
            type="button"
          >
            Back
          </button>
          <button
            className="error-action"
            onClick={() => {
              window.location.href = "/";
            }}
            type="button"
          >
            Home
          </button>
          <button
            className="error-action error-action--primary"
            onClick={() => window.location.reload()}
            type="button"
          >
            Try again
          </button>
        </div>
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
