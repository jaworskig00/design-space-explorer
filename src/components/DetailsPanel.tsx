import {
  COLUMNS,
  formatValue,
  getTable,
  nearestNaca,
  type DesignTable,
} from '../data/columns.ts'
import { windTunnelHref } from '../lib/windTunnel.ts'
import { ShapePreview } from '../charts/ShapePreview.tsx'
import { useExplorer } from '../state/explorerStore.ts'

function pinnedShape(table: DesignTable, id: number) {
  const camber = table.columns.camber[id] ?? 0
  const camberPos = table.columns.camber_pos[id] ?? 0
  const thickness = table.columns.thickness[id] ?? 0
  return {
    camber,
    camberPos,
    thickness,
    tunnelHref: windTunnelHref(import.meta.env.VITE_WIND_TUNNEL_URL, {
      camber,
      camberPos,
      thickness,
      alphaDeg: table.columns.alpha_deg[id] ?? 0,
    }),
  }
}

export function DetailsPanel() {
  const ready = useExplorer((state) => state.ready)
  const selectedId = useExplorer((state) => state.selectedId)
  const table = ready ? getTable() : null
  if (!table || selectedId == null) {
    return (
      <section className="panel" data-testid="view-details">
        <h2>Details</h2>
        <ShapePreview />
      </section>
    )
  }
  const pinned = pinnedShape(table, selectedId)
  return (
    <section className="panel" data-testid="view-details">
      <h2>Details</h2>
      <div data-testid="details">
        <p>
          id {selectedId}
          <span className="muted">
            {' '}
            · nearest NACA{' '}
            {nearestNaca(pinned.camber, pinned.camberPos, pinned.thickness)}
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
        {pinned.tunnelHref ? (
          <p className="tunnel-link">
            <a
              href={pinned.tunnelHref}
              target="_blank"
              rel="noreferrer"
              data-testid="wind-tunnel-link"
            >
              Open this shape in the wind tunnel
            </a>
          </p>
        ) : null}
        <ShapePreview />
      </div>
    </section>
  )
}
