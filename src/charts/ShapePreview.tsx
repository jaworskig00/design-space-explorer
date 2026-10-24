import { airfoilPath } from '../data/airfoilShape.ts'
import { formatValue, getTable, nearestNaca } from '../data/columns.ts'
import { useExplorer } from '../state/explorerStore.ts'

export function ShapePreview() {
  const ready = useExplorer((state) => state.ready)
  const selectedId = useExplorer((state) => state.selectedId)
  if (!ready || selectedId == null) {
    return <p className="muted">Pin a design to see its outline.</p>
  }
  const table = getTable()
  const camber = table.columns.camber[selectedId] ?? 0
  const camberPos = table.columns.camber_pos[selectedId] ?? 0.4
  const thickness = table.columns.thickness[selectedId] ?? 0.12
  const code = nearestNaca(camber, camberPos, thickness)
  return (
    <svg
      data-testid="shape-preview"
      viewBox="-0.05 -0.25 1.1 0.5"
      role="img"
      aria-label={`Nearest NACA ${code}, exact thickness ${formatValue('thickness', thickness)}`}
    >
      <path
        d={airfoilPath(camber, camberPos, thickness)}
        transform="scale(1,-1)"
        fill="#3ddc97"
        opacity="0.85"
      />
    </svg>
  )
}
