import { TIME_RANGE_OPTIONS } from '../config/constants.js';
import { formatDateTime } from '../utils/formatting.js';
import { ConnectionStatus } from './ConnectionStatus.jsx';

export function Header({
  workspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  selectedTimeRange,
  onTimeRangeChange,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  onSearchResultSelect,
  connectionStatus,
  mode,
  generatedAt,
  authLabel,
  onLogout
}) {
  return (
    <header className="topbar">
      <div className="topbar-intro">
        <p className="eyebrow">Codex control plane</p>
        <h1>Operational visibility for local agent workflows.</h1>
      </div>

      <div className="topbar-controls">
        <div className="search-block">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search runs, sessions, tools, approvals…"
            aria-label="Search dashboard"
          />
          {searchQuery ? (
            <div className="search-results-panel">
              {searchResults.length ? (
                searchResults.map((result) => (
                  <button
                    type="button"
                    key={`${result.page}-${result.id}`}
                    className="search-result"
                    onClick={() => onSearchResultSelect(result)}
                  >
                    <strong>{result.title}</strong>
                    <span>{result.meta}</span>
                  </button>
                ))
              ) : (
                <div className="search-empty">No matches in the current slice.</div>
              )}
            </div>
          ) : null}
        </div>

        <label className="toolbar-select">
          <span>Workspace</span>
          <select value={selectedWorkspaceId} onChange={(event) => onWorkspaceChange(event.target.value)}>
            <option value="all">All workspaces</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
            ))}
          </select>
        </label>

        <label className="toolbar-select">
          <span>Range</span>
          <select value={selectedTimeRange} onChange={(event) => onTimeRangeChange(event.target.value)}>
            {TIME_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <ConnectionStatus
          connectionStatus={connectionStatus}
          mode={mode}
          generatedAt={generatedAt}
          authLabel={authLabel}
        />

        <div className="header-actions">
          <p className="header-stamp">Last snapshot {formatDateTime(generatedAt)}</p>
          <button type="button" className="ghost-button" onClick={onLogout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
