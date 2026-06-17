import { useNavigate } from "react-router";

import PageTopMenu, { type PageTopMenuAction } from "../PageTopMenu";
import { crudOps, type CrudOperation } from "../../utils/crudRouteUtils";

type CrudPageTopMenuProps = {
  operation: CrudOperation;
  entityTitle: string;
  listRouteUrl: string;
  loaderError: string | null;
};

function formatOperation(operation: CrudOperation) {
  return operation.charAt(0).toUpperCase() + operation.slice(1);
}

export default function CrudPageTopMenu({
  operation,
  entityTitle,
  listRouteUrl,
  loaderError,
}: CrudPageTopMenuProps) {
  const navigate = useNavigate();
  const navigateToList = () => navigate(listRouteUrl);
  const shouldShowDone = !!loaderError || operation === crudOps.view;
  const done: PageTopMenuAction = {
    label: "Done",
    onClick: navigateToList,
  };
  const submit: PageTopMenuAction = {
    label: formatOperation(operation),
    type: "submit",
  };
  const cancel: PageTopMenuAction = {
    label: "Cancel",
    onClick: navigateToList,
    variant: "cancel",
  };

  return (
    <PageTopMenu
      title={`${formatOperation(operation)} ${entityTitle}`}
      actions={shouldShowDone ? [done] : [submit, cancel]}
    />
  );
}
