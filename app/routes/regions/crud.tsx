import "./styles.css";

import { useNavigate, useParams } from "react-router";

import PageTopMenu from "../../components/PageTopMenu";
import Layout from "../layout";

function formatAction(action: string | undefined) {
  if (!action) {
    return "Unknown";
  }

  return action.charAt(0).toUpperCase() + action.slice(1);
}

export default function Crud() {
  const navigate = useNavigate();
  const params = useParams();

  return (
    <Layout>
      <section className="page">
        <PageTopMenu
          title={`${formatAction(params.action)} Region`}
          actions={[
            ...(params.action === "create" ||
            params.action === "update" ||
            params.action === "delete"
              ? [
                  {
                    label: "Cancel",
                    onClick: () => navigate(-1),
                    variant: "cancel" as const,
                  },
                ]
              : []),
            {
              label: params.action === "view" ? "Done" : formatAction(params.action),
              onClick: () => undefined,
            },
          ]}
        />
      </section>
    </Layout>
  );
}
