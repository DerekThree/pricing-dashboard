import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listAttributes } from "../../generated/api/client";
import { AttributeType, type AttributeListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { dateTimeFormatter, productTypesFormatter } from "../../utils/valueFormatters";
import { attributeTypeLabels } from "./attributeTypeLabels";

const columnDefs: ColDef<AttributeListItem>[] = [
  { field: "attribute", headerName: "Attribute" },
  {
    field: "type",
    headerName: "Attribute Type",
    valueFormatter: ({ value }) => attributeTypeLabels[value as AttributeType],
  },
  {
    field: "productTypes",
    headerName: "Product Types",
    valueFormatter: productTypesFormatter,
  },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: dateTimeFormatter },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listAttributes();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as AttributeListItem[], loaderError: getErrorMessage(data, status) };
}

export default function AccountAttributesPage() {
  const { rowData, loaderError } = useLoaderData<typeof clientLoader>();

  return (
    <ListPage
      title="Account Attributes"
      columnDefs={columnDefs}
      rowData={rowData}
      crudRouteUrl={routeUrls.accountAttributes}
      loaderError={loaderError}
    />
  );
}
