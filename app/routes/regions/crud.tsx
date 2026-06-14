import "./styles.css";

import { Form, useLoaderData, useParams } from "react-router";

import CrudPageTopMenu from "../../components/CrudPageTopMenu";
import useFormValues from "../../hooks/useFormValues";
import {
  createCrudRouteHandlers,
  type FormValues,
} from "../../utils/crudRouteUtils";

const regionFields = [
  "regionCode",
  "regionName",
  "states",
  "zipCodes",
  "branches",
] as const;

type RegionFormValues = FormValues<typeof regionFields>;

const routeHandlers = createCrudRouteHandlers({
  fields: regionFields,
  apiUrl: "/regions",
  listRouteUrl: "/regions",
});

export const action = routeHandlers.action;
export const loader = routeHandlers.loader;

export default function Crud() {
  const { action } = useParams();
  const { record, loaderError } = useLoaderData<typeof loader>();
  const inputsDisabled = !!loaderError || action === "view" || action === "delete";
  const { formValues, updateField } = useFormValues<RegionFormValues>(record);

  return (
    <section className="page">
      <Form method="post">
        <CrudPageTopMenu
          action={action}
          entityTitle="Region"
          listRouteUrl="/regions"
          loaderError={loaderError}
        />
        {loaderError && <p className="crud-loader-error">{loaderError}</p>}
        <div className="crud-form-column">
          <label className="crud-form-field" htmlFor="region-code">
            <span>Region Code</span>
            <input
              disabled={inputsDisabled}
              id="region-code"
              name="regionCode"
              required
              type="text"
              value={formValues.regionCode}
              onChange={(event) =>
                updateField("regionCode", event.target.value.toUpperCase())
              }
            />
          </label>
          <label className="crud-form-field" htmlFor="region-name">
            <span>Region Name</span>
            <input
              disabled={inputsDisabled}
              id="region-name"
              name="regionName"
              required
              type="text"
              value={formValues.regionName}
              onChange={(event) =>
                updateField("regionName", event.target.value)
              }
            />
          </label>
          <label className="crud-form-field" htmlFor="states">
            <span>States</span>
            <input
              disabled={inputsDisabled}
              id="states"
              name="states"
              required
              type="text"
              value={formValues.states}
              onChange={(event) => updateField("states", event.target.value)}
            />
          </label>
          <label className="crud-form-field" htmlFor="zip-codes">
            <span>Zip Codes</span>
            <input
              disabled={inputsDisabled}
              id="zip-codes"
              name="zipCodes"
              required
              type="text"
              value={formValues.zipCodes}
              onChange={(event) => updateField("zipCodes", event.target.value)}
            />
          </label>
          <label className="crud-form-field" htmlFor="branches">
            <span>Branches</span>
            <input
              disabled={inputsDisabled}
              id="branches"
              name="branches"
              required
              type="text"
              value={formValues.branches}
              onChange={(event) => updateField("branches", event.target.value)}
            />
          </label>
        </div>
      </Form>
    </section>
  );
}
