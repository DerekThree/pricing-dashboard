import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listPricingPlans } from "../../generated/api/client";
import type { PricingPlan } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";

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

export async function clientLoader() {
  const response = await listPricingPlans();
  const status: number = response.status;

  if (status === 200) {
    return { rowData: response.data, loaderError: null };
  }

  return { rowData: [] as PricingPlan[], loaderError: getErrorMessage(response.data, status) };
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
