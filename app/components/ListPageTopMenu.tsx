import "../styles/pageTopMenu.css";

type ListPageTopMenuProps = {
  actionsDisabled?: boolean;
  title: string;
  onCreate?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function ListPageTopMenu({
  actionsDisabled = false,
  title,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: ListPageTopMenuProps) {
  const actions = [
    { label: "Create", onClick: onCreate },
    { label: "View", onClick: onView },
    { label: "Edit", onClick: onEdit },
    { label: "Delete", onClick: onDelete },
  ].filter((action) => action.onClick);

  return (
    <header className="page-top-menu">
      <h2 className="page-top-menu-title">{title}</h2>
      {actions.length > 0 && (
        <div className="page-top-menu-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              className="page-top-menu-action"
              disabled={actionsDisabled}
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
