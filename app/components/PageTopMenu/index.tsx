import { useNavigate } from "react-router";

import "./styles.css";

type PageTopMenuProps = {
  title: string;
  onCreate?: () => void;
  onView?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  actionsEnabled?: boolean;
  action?: string;
  onAction?: () => void;
};

type PageTopMenuAction = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "cancel" | "action";
};

function getActionLabel(action: string | undefined) {
  if (action === undefined) {
    return "Submit";
  }

  if (action === "view") {
    return "Done";
  }

  return action.charAt(0).toUpperCase() + action.slice(1);
}

export default function PageTopMenu({
  title,
  onCreate,
  onView,
  onUpdate,
  onDelete,
  actionsEnabled = false,
  action,
  onAction,
}: PageTopMenuProps) {
  const navigate = useNavigate();
  const shouldShowCancel =
    action === "create" || action === "update" || action === "delete";

  const actions: PageTopMenuAction[] = [
    { label: "Create", onClick: onCreate, disabled: false },
    { label: "View", onClick: onView, disabled: !actionsEnabled },
    { label: "Update", onClick: onUpdate, disabled: !actionsEnabled },
    { label: "Delete", onClick: onDelete, disabled: !actionsEnabled },
    {
      label: "Cancel",
      onClick: shouldShowCancel ? () => navigate(-1) : undefined,
      disabled: false,
      variant: "cancel" as const,
    },
    {
      label: getActionLabel(action),
      onClick: onAction,
      disabled: false,
      variant: action === "view" ? undefined : ("action" as const),
    },
  ].filter((action) => action.onClick);

  return (
    <header className="page-top-menu">
      <h2 className="page-top-menu-title">{title}</h2>
      {actions.length > 0 && (
        <div className="page-top-menu-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              className={`page-top-menu-action page-top-menu-action--${
                action.variant ?? ""
              }`}
              disabled={action.disabled}
              onClick={action.onClick}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
