import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { getApi } from "../../utils/apiUtils";

type PricingPlanRow = {
  id: number;
  planCode: string;
  planName: string;
  productCode: string;
  productName: string;
  regionCode: string;
  regionName: string;
  activeFrom: string;
  activeTo: string;
  updatedOn: string;
  updatedBy: string;
};

const columnDefs: ColDef<PricingPlanRow>[] = [
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
  return getApi<PricingPlanRow[]>("/pricing-plans");
}

export default function PricingPlanList() {
  const rowData = useLoaderData<typeof loader>();

  return (
    <ListPage
      title="Pricing Plans"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl="/pricing-plans"
    />
  );
}
