import "./styles.css";

import { useParams } from "react-router";

import PageTopMenu from "../../components/PageTopMenu";
import Layout from "../layout";

function formatAction(action: string | undefined) {
  if (!action) {
    return "Unknown";
  }

  return action.charAt(0).toUpperCase() + action.slice(1);
}

export default function Crud() {
  const params = useParams();

  return (
    <Layout>
      <section className="page">
        <PageTopMenu
          title={`${formatAction(params.action)} Region`}
          onAction={() => undefined}
          action={params.action}
          actionsEnabled={Boolean(false)}
        />
      </section>
    </Layout>
  );
}
