import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listProducts } from "../../generated/api/client";
import { ProductType, type ProductListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { dateTimeFormatter } from "../../utils/valueFormatters";
import { productTypeLabels } from "./productTypeLabels";

const columnDefs: ColDef<ProductListItem>[] = [
  { field: "product", headerName: "Product" },
  {
    field: "productType",
    headerName: "Product Type",
    valueFormatter: ({ value }) => productTypeLabels[value as ProductType],
  },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: dateTimeFormatter },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listProducts();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as ProductListItem[], loaderError: getErrorMessage(data, status) };
}

export default function ProductsPage() {
  const { rowData, loaderError } = useLoaderData<typeof clientLoader>();

  return (
    <ListPage
      title="Products"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.products}
      loaderError={loaderError}
    />
  );
}
