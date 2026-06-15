import { useNavigate } from "react-router";

import PageTopMenu, { type PageTopMenuAction } from "../PageTopMenu";

type CrudPageTopMenuProps = {
  operation: string | undefined;
  entityTitle: string;
  listRouteUrl: string;
  loaderError: string | null;
};

function formatOperation(op: string | undefined) {
  return op ? op.charAt(0).toUpperCase() + op.slice(1) : "Unknown";
}

export default function CrudPageTopMenu({
  operation,
  entityTitle,
  listRouteUrl,
  loaderError,
}: CrudPageTopMenuProps) {
  const navigate = useNavigate();
  const navigateToList = () => navigate(listRouteUrl);
  const shouldShowDone = !!loaderError || operation === "view";
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
