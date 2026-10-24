import { COLUMNS, formatValue, getTable, nearestNaca } from '../data/columns.ts'
import { ShapePreview } from '../charts/ShapePreview.tsx'
import { useExplorer } from '../state/explorerStore.ts'

export function DetailsPanel() {
  const ready = useExplorer((state) => state.ready)
  const selectedId = useExplorer((state) => state.selectedId)
  const table = ready ? getTable() : null
  const camber =
    table && selectedId != null ? (table.columns.camber[selectedId] ?? 0) : 0
  const camberPos =
    table && selectedId != null
      ? (table.columns.camber_pos[selectedId] ?? 0)
      : 0
  const thickness =
    table && selectedId != null ? (table.columns.thickness[selectedId] ?? 0) : 0
  return (
    <section className="panel" data-testid="view-details">
      <h2>Details</h2>
      {table && selectedId != null ? (
        <div data-testid="details">
          <p>
            id {selectedId}
            <span className="muted">
              {' '}
              · nearest NACA {nearestNaca(camber, camberPos, thickness)}
            </span>
          </p>
          <dl>
            {COLUMNS.map((column) => (
              <div key={column}>
                <dt>
                  {table.meta[column].label} ({table.meta[column].unit})
                </dt>
                <dd>
                  {formatValue(column, table.columns[column][selectedId] ?? 0)}
                </dd>
              </div>
            ))}
          </dl>
          <ShapePreview />
        </div>
      ) : (
        <ShapePreview />
      )}
    </section>
  )
}
