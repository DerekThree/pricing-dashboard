import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";
import { useNavigate } from "react-router";

import ListPage from "../../components/ListPage";
import { listPricingPlans } from "../../generated/api/client";
import type { PricingPlanListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { dateTimeFormatter } from "../../utils/valueFormatters";
import PageTopMenu from "~/app/components/PageTopMenu";
import DataTable from "~/app/components/DataTable";
import { useState } from "react";

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
  const navigate = useNavigate();
  const crudRouteUrl = routeUrls.pricingPlans;
  const [selectedRow, setSelectedRow] = useState<PricingPlanListItem>();

  return (
    <section className="page">
      <PageTopMenu
        title={"Pricing Plans"}
        actions={[
          {
            label: "Create",
            onClick: () => navigate(`${crudRouteUrl}/create`),
          },
          {
            label: "Duplicate",
            onClick: () => navigate(`${crudRouteUrl}/create/${selectedRow!.id}`),
            disabled: !selectedRow,
          },          
          {
            label: "View",
            onClick: () =>
              navigate(`${crudRouteUrl}/view/${selectedRow!.id}`),
            disabled: !selectedRow,
          },
          {
            label: "Update",
            onClick: () =>
              navigate(`${crudRouteUrl}/update/${selectedRow!.id}`),
            disabled: !selectedRow,
          },
          {
            label: "Delete",
            onClick: () =>
              navigate(`${crudRouteUrl}/delete/${selectedRow!.id}`),
            disabled: !selectedRow,
          },
        ]}
      />
      {loaderError && <p className="page-error">{loaderError}</p>}
      <DataTable
        columnDefs={columnDefs}
        rowData={rowData}
        setSelectedRow={setSelectedRow}
      />
    </section>
  );
}
