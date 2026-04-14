import { EmptyState } from './EmptyState.jsx';

export function DataTable({
  caption,
  columns,
  rows,
  keyField = 'id',
  onRowClick,
  selectedId,
  emptyTitle = 'Nothing to show yet.',
  emptyBody = 'Try a different workspace or wait for new activity.',
  className = ''
}) {
  if (!rows.length) {
    return <EmptyState eyebrow={caption} title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className={`table-wrap ${className}`.trim()}>
      <table className="data-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.headerClassName}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowId = row[keyField];
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={rowId}
                className={[
                  clickable ? 'is-clickable' : '',
                  selectedId === rowId ? 'is-selected' : ''
                ].filter(Boolean).join(' ')}
                onClick={clickable ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.cellClassName}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
