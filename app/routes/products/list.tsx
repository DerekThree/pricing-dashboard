import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listProducts } from "../../generated/api/client";
import type { Product } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";

const columnDefs: ColDef<Product>[] = [
  { field: "productCode", headerName: "Product Code" },
  { field: "productName", headerName: "Product Name" },
  { field: "accountType", headerName: "Account Type" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const response = await listProducts();
  const status: number = response.status;

  if (status === 200) {
    return { rowData: response.data, loaderError: null };
  }

  return { rowData: [] as Product[], loaderError: getErrorMessage(response.data, status) };
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
