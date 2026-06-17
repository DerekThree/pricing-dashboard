import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listPricingPlans } from "../../generated/api/client";
import type { PricingPlan } from "../../generated/api/models";
import { routeUrls } from "../../routes";

const columnDefs: ColDef<PricingPlan>[] = [
  { field: "planCode", headerName: "Plan Code" },
  { field: "planName", headerName: "Plan Name" },
  { field: "productCode", headerName: "Product Code" },
  { field: "productName", headerName: "Product Name" },
  { field: "regionCode", headerName: "Region Code" },
  { field: "regionName", headerName: "Region Name" },
  { field: "activeFrom", headerName: "Active From" },
  { field: "activeTo", headerName: "Active To" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function loader() {
  const response = await listPricingPlans();

  return response.data;
}

export default function PricingPlansPage() {
  const rowData = useLoaderData<typeof loader>();

  return (
    <ListPage
      title="Pricing Plans"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.pricingPlans}
    />
  );
}
