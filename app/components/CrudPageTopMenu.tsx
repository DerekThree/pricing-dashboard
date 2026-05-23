import { useNavigate, useParams } from "react-router";

import Layout from "../routes/layout";
import "../styles/pageTopMenu.css";

type CrudPageTopMenuProps = {
  entityName: string;
};

function formatOperation(operation: string | undefined) {
  if (!operation) {
    return "Unknown";
  }

  return operation.charAt(0).toUpperCase() + operation.slice(1);
}

export default function CrudPageTopMenu({ entityName }: CrudPageTopMenuProps) {
  const navigate = useNavigate();
  const params = useParams();
  const operation = formatOperation(params.operation);

  return (
    <Layout>
      <section className="page">
        <header className="page-top-menu">
          <h2 className="page-top-menu-title">
            {operation} {entityName}
          </h2>
          <div className="page-top-menu-actions">
            <button
              className="page-top-menu-action"
              onClick={() => navigate(-1)}
              type="button"
            >
              Cancel
            </button>
            <button className="page-top-menu-action" type="button">
              Submit
            </button>
          </div>
        </header>
      </section>
    </Layout>
  );
}
