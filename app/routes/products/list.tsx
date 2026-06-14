import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { getApi } from "../../utils/apiUtils";

type ProductRow = {
  id: number;
  productCode: string;
  productName: string;
  accountType: string;
  updatedOn: string;
  updatedBy: string;
};

const columnDefs: ColDef<ProductRow>[] = [
  { field: "productCode", headerName: "Product Code" },
  { field: "productName", headerName: "Product Name" },
  { field: "accountType", headerName: "Account Type" },
  { field: "updatedOn", headerName: "Updated On" },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function loader() {
  return getApi<ProductRow[]>("/products");
}

export default function ProductList() {
  const rowData = useLoaderData<typeof loader>();

  return (
    <ListPage
      title="Products"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl="/products"
    />
  );
}
