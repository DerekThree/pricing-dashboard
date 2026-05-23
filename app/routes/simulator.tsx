import Layout from "./layout";

function SimulatorContent() {
  return (
    <section className="page">
      <h2 className="page-heading mb-2">Batch Simulator</h2>
      <div className="text-sm text-gray-600">(Blank simulator screen)</div>
    </section>
  );
}

export default function SimulatorPage() {
  return (
    <Layout>
      <SimulatorContent />
    </Layout>
  );
}
