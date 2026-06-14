import { useNavigate } from "react-router";

import PageTopMenu, { type PageTopMenuAction } from "../PageTopMenu";

type CrudPageTopMenuProps = {
  action: string | undefined;
  entityTitle: string;
  listRouteUrl: string;
  loaderError: string | null;
};

function formatAction(action: string | undefined) {
  return action
    ? action.charAt(0).toUpperCase() + action.slice(1)
    : "Unknown";
}

export default function CrudPageTopMenu({
  action,
  entityTitle,
  listRouteUrl,
  loaderError,
}: CrudPageTopMenuProps) {
  const navigate = useNavigate();
  const navigateToList = () => navigate(listRouteUrl);
  const shouldShowDone = !!loaderError || action === "view";
  const done: PageTopMenuAction = {
    label: "Done",
    onClick: navigateToList,
  };
  const submit: PageTopMenuAction = {
    label: formatAction(action),
    type: "submit",
  };
  const cancel: PageTopMenuAction = {
    label: "Cancel",
    onClick: navigateToList,
    variant: "cancel",
  };

  return (
    <PageTopMenu
      title={`${formatAction(action)} ${entityTitle}`}
      actions={shouldShowDone ? [done] : [submit, cancel]}
    />
  );
}
