import "./styles.css";

import { useState, type FormEvent } from "react";
import { useLoaderData } from "react-router";

import PageTopMenu from "../../components/PageTopMenu";
import { getSimulatorDate, setSimulatorDate } from "../../generated/api/client";
import { getErrorMessage } from "../../utils/apiUtils";
import { showToast } from "../../utils/toast";

export async function clientLoader() {
  const response = await getSimulatorDate();

  return response.status === 200
    ? { currentDate: response.data.currentDate, loaderError: null }
    : { currentDate: "", loaderError: getErrorMessage(response.data, response.status) };
}

export default function SimulatorPage() {
  const { currentDate, loaderError } = useLoaderData<typeof clientLoader>();
  const [applicationDate, setApplicationDate] = useState(currentDate);
  const [error, setError] = useState(loaderError);

  async function submitDate(currentDate: string) {
    setError(null);

    const response = await setSimulatorDate({ currentDate });
    if (response.status === 200) {
      setApplicationDate(response.data.currentDate);
      showToast("Success");
    } else {
      setError(getErrorMessage(response.data, response.status));
    }
  }

  return (
    <section className="page">
        <PageTopMenu
          title="Batch Simulator"
        />
        {error && <p className="page-error">{error}</p>}
        <div className="form-grid">
          <div className="crud-page-form-column">
            <label className="crud-page-form-field">
              <span>Application Date</span>
              <input
                type="date"
                value={applicationDate}
                disabled={!!loaderError}
                required
                onChange={(event) => submitDate(event.target.value)}
              />
            </label>
          </div>
        </div>
    </section>
  );
}
