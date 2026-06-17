import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listProducts } from "../../generated/api/client";
import type { Product } from "../../generated/api/models";
import { routeUrls } from "../../routes";

const columnDefs: ColDef<Product>[] = [
  { field: "productCode", headerName: "Product Code" },
  { field: "productName", headerName: "Product Name" },
  { field: "accountType", headerName: "Account Type" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function loader() {
  const response = await listProducts();

  return response.data;
}

export default function ProductsPage() {
  const rowData = useLoaderData<typeof loader>();

  return (
    <ListPage
      title="Products"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.products}
    />
  );
}
