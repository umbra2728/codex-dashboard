import { NAV_ITEMS } from '../config/constants.js';
import { Header } from './Header.jsx';

export function AppShell({
  activeView,
  onSelectView,
  currentWorkspace,
  workspaceCount,
  headerProps,
  children
}) {
  return (
    <div className="app-shell">
      <aside className="nav-rail">
        <div className="brand-block">
          <p className="brand-mark">CDX / OPS</p>
          <h2>Codex Dashboard</h2>
          <p className="brand-copy">A local-first lens for runs, tools, governance, and usage.</p>
        </div>

        <nav className="rail-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === activeView ? 'nav-item is-active' : 'nav-item'}
              onClick={() => onSelectView(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.kicker}</small>
            </button>
          ))}
        </nav>

        <div className="rail-footer">
          <p className="eyebrow">Scope</p>
          <h3>{currentWorkspace?.name || 'All workspaces'}</h3>
          <p>{workspaceCount} workspace surfaces available in this snapshot.</p>
        </div>
      </aside>

      <div className="app-stage">
        <Header {...headerProps} />
        <main className="page-stage">{children}</main>
      </div>
    </div>
  );
}
