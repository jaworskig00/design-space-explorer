import { COLUMNS, type ColumnName } from '../data/columns.ts'
import { useExplorer } from '../state/explorerStore.ts'

export function Toolbar() {
  const ready = useExplorer((state) => state.ready)
  const matchCount = useExplorer((state) => state.matchCount)
  const colorColumn = useExplorer((state) => state.colorColumn)
  const n = ready ? useExplorer.getState().mask.length : 0
  return (
    <header className="toolbar">
      <h1>Design Space Explorer</h1>
      <p className="counts">
        <span data-testid="filter-count">{ready ? matchCount : '—'}</span>
        {' of '}
        <span data-testid="design-count">{ready ? n : '—'}</span>
      </p>
      <p className="sr-only" aria-live="polite">
        {ready ? `${matchCount} of ${n} designs` : 'Loading designs'}
      </p>
      <div className="spacer" />
      <label>
        Color
        <select
          aria-label="Color by"
          value={colorColumn}
          onChange={(event) =>
            useExplorer.getState().setColor(event.target.value as ColumnName)
          }
        >
          {COLUMNS.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        data-testid="reset-filters"
        onClick={() => useExplorer.getState().clearBrushes()}
      >
        Reset
      </button>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(window.location.href)
        }}
      >
        Copy link
      </button>
    </header>
  )
}
