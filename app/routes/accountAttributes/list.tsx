import { useLoaderData } from "react-router";
import type { ColDef } from "ag-grid-community";

import ListPage from "../../components/ListPage";
import { listAttributes } from "../../generated/api/client";
import { AccountAttributeType, type AccountAttributeListItem } from "../../generated/api/models";
import { routeUrls } from "../../routes";
import { getErrorMessage } from "../../utils/apiUtils";
import { formatDateTime } from "../../utils/dateTimeUtils";

const attributeTypeLabels: Record<AccountAttributeListItem["type"], string> = {
  [AccountAttributeType.TEXT]: "Text",
  [AccountAttributeType.DECIMAL]: "Decimal",
  [AccountAttributeType.INTEGER]: "Integer",
  [AccountAttributeType.DATE]: "Date",
  [AccountAttributeType.BOOLEAN]: "Boolean",
};

const columnDefs: ColDef<AccountAttributeListItem>[] = [
  { field: "attribute", headerName: "Attribute" },
  {
    field: "type",
    headerName: "Attribute Type",
    valueFormatter: ({ value }) => attributeTypeLabels[value as AccountAttributeListItem["type"]] ?? value,
  },
  { field: "updatedOn", headerName: "Updated On", valueFormatter: ({ value }) => formatDateTime(value) },
  { field: "updatedBy", headerName: "Updated By" },
];

export async function clientLoader() {
  const { status, data } = await listAttributes();

  return status === 200
    ? { rowData: data, loaderError: null }
    : { rowData: [] as AccountAttributeListItem[], loaderError: getErrorMessage(data, status) };
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
