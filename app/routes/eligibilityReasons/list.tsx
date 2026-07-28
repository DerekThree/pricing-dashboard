import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listEligibilityReasons } from "../../generated/api/client";
import type { EligibilityReasonListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { formatDateTime } from "../../utils/dateTimeUtils";

const columnDefs: ColDef<EligibilityReasonListItem>[] = [
  { field: "eligibilityReason", headerName: "Eligibility Reason" },
  { field: "conditions", headerName: "Conditions", valueFormatter: ({ value }) => Array.isArray(value) ? value.join(", ") : "" },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: ({ value }) => formatDateTime(value) },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listEligibilityReasons();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as EligibilityReasonListItem[], loaderError: getErrorMessage(data, status) };
}

export default function EligibilityReasonsPage() {
  const { rowData, loaderError } = useLoaderData<typeof clientLoader>();

  return (
    <ListPage
      title="Eligibility Reasons"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.eligibilityReasons}
      loaderError={loaderError}
    />
  );
}
