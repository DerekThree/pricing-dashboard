import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listReasons } from "../../generated/api/client";
import type { ReasonListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { listFormatter, dateTimeFormatter } from "../../utils/valueFormatters";

const columnDefs: ColDef<ReasonListItem>[] = [
  { field: "eligibilityReason", headerName: "Eligibility Reason" },
  { field: "conditions", headerName: "Conditions", valueFormatter: listFormatter },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: dateTimeFormatter },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listReasons();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as ReasonListItem[], loaderError: getErrorMessage(data, status) };
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
