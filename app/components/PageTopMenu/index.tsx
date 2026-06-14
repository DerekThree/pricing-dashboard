import "./styles.css";

type PageTopMenuProps = {
  title: string;
  actions?: PageTopMenuAction[];
};

type PageTopMenuAction = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "cancel";
};

export default function PageTopMenu({
  title,
  actions = [],
}: PageTopMenuProps) {
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
