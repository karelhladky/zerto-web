interface HeaderProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
  showSettings: boolean;
  onSettings: () => void;
  showAdd: boolean;
  onAdd: () => void;
}

export default function Header({ title, showBack, onBack, showSettings, onSettings, showAdd, onAdd }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        {showBack && (
          <button className="header-btn" onClick={onBack} aria-label="Zpět">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>

      <h1 className="header-title">{title}</h1>

      <div className="header-right">
        {showSettings && (
          <button className="header-btn" onClick={onSettings} aria-label="Nastavení">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        )}
        {showAdd && (
          <button className="header-btn header-btn-add" onClick={onAdd} aria-label="Přidat">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
