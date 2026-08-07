import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listPricingPlans } from "../../generated/api/client";
import type { PricingPlanListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { dateTimeFormatter } from "../../utils/valueFormatters";

function formatDate(value: unknown) {
  return typeof value === "string" ? value : "";
}

const columnDefs: ColDef<PricingPlanListItem>[] = [
  { field: "pricingPlan", headerName: "Pricing Plan" },
  { field: "product", headerName: "Product" },
  { field: "region", headerName: "Region" },
  { field: "activeFrom", headerName: "Active From", valueFormatter: dateTimeFormatter },
  { field: "activeThrough", headerName: "Active Through", valueFormatter: dateTimeFormatter },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: dateTimeFormatter },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listPricingPlans();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as PricingPlanListItem[], loaderError: getErrorMessage(data, status) };
}

export default function PricingPlansPage() {
  const { rowData, loaderError } = useLoaderData<typeof clientLoader>();

  return (
    <ListPage
      title="Pricing Plans"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.pricingPlans}
      loaderError={loaderError}
    />
  );
}
