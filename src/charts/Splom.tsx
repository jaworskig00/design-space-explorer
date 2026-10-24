import { brush } from 'd3-brush'
import { select } from 'd3-selection'
import { useLayoutEffect, useRef } from 'react'
import { COLUMNS, getTable } from '../data/columns.ts'
import { recordDraw } from '../e2eApi.ts'
import { useExplorer } from '../state/explorerStore.ts'
import { resizeCanvas } from './geometry.ts'
import { columnScale } from './scales.ts'
import { useSize } from './useSize.ts'

export function Splom() {
  const [ref, size] = useSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const ready = useExplorer((state) => state.ready)
  const splomColumns = useExplorer((state) => state.splomColumns)

  useLayoutEffect(() => {
    if (!ready || size.width < 40 || size.height < 40) return
    const canvas = canvasRef.current
    const svgElement = svgRef.current
    if (!canvas || !svgElement) return
    const table = getTable()
    const svg = select(svgElement)
    const draw = () => {
      const started = performance.now()
      const columns = useExplorer.getState().splomColumns
      const n = columns.length
      if (n < 2) return
      const cell = Math.min(size.width, size.height) / n
      const dpr = resizeCanvas(canvas, size.width, size.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const image = ctx.createImageData(canvas.width, canvas.height)
      const pixels = image.data
      const mask = useExplorer.getState().mask
      svg.selectAll('*').remove()
      for (let row = 0; row < n; row += 1) {
        for (let col = row + 1; col < n; col += 1) {
          const xName = columns[col]
          const yName = columns[row]
          if (!xName || !yName) continue
          const x0 = col * cell
          const y0 = row * cell
          const x = columnScale(table, xName, [x0 + 4, x0 + cell - 4], false)
          const y = columnScale(table, yName, [y0 + cell - 4, y0 + 4], false)
          const xs = table.columns[xName]
          const ys = table.columns[yName]
          const left = Math.round((x0 + 4) * dpr)
          const right = Math.round((x0 + cell - 4) * dpr)
          const top = Math.round((y0 + 4) * dpr)
          const bottom = Math.round((y0 + cell - 4) * dpr)
          for (let i = 0; i < table.n; i += 1) {
            const px = Math.round((x(xs[i] ?? 0) ?? 0) * dpr)
            const py = Math.round((y(ys[i] ?? 0) ?? 0) * dpr)
            if (px < left || px >= right || py < top || py >= bottom) continue
            const offset = (py * canvas.width + px) * 4
            if (mask[i]) {
              pixels[offset] = 61
              pixels[offset + 1] = 220
              pixels[offset + 2] = 151
              pixels[offset + 3] = 140
            } else if (pixels[offset + 3] === 0) {
              pixels[offset] = 147
              pixels[offset + 1] = 160
              pixels[offset + 2] = 181
              pixels[offset + 3] = 40
            }
          }
        }
      }
      ctx.putImageData(image, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      for (let index = 0; index < n; index += 1) {
        const name = columns[index]
        if (!name) continue
        const x0 = index * cell
        const y0 = index * cell
        drawHist(
          ctx,
          table.columns[name],
          table.meta[name].domain,
          mask,
          x0 + 4,
          y0 + 4,
          cell - 8,
        )
      }
      for (let row = 0; row < n; row += 1) {
        for (let col = row + 1; col < n; col += 1) {
          const xName = columns[col]
          const yName = columns[row]
          if (!xName || !yName) continue
          const x0 = col * cell
          const y0 = row * cell
          const x = columnScale(table, xName, [x0 + 4, x0 + cell - 4], false)
          const y = columnScale(table, yName, [y0 + cell - 4, y0 + 4], false)
          const cellBrush = brush()
            .extent([
              [x0 + 4, y0 + 4],
              [x0 + cell - 4, y0 + cell - 4],
            ])
            .on(
              'end',
              (event: {
                selection: [[number, number], [number, number]] | null
                sourceEvent: Event | null
              }) => {
                if (!event.sourceEvent) return
                if (!event.selection) {
                  useExplorer.getState().setBrush(xName, null, 'pointer')
                  useExplorer.getState().setBrush(yName, null, 'pointer')
                  return
                }
                const [[sx0, sy0], [sx1, sy1]] = event.selection
                useExplorer
                  .getState()
                  .setBrush(xName, [x.invert(sx0), x.invert(sx1)], 'pointer')
                useExplorer
                  .getState()
                  .setBrush(yName, [y.invert(sy0), y.invert(sy1)], 'pointer')
              },
            )
          svg.append('g').call(cellBrush)
        }
      }
      canvas.setAttribute(
        'aria-label',
        `Scatterplot matrix, ${useExplorer.getState().matchCount} of ${table.n} designs`,
      )
      recordDraw('splom', started)
    }
    draw()
    const unsubscribe = useExplorer.subscribe((state, previous) => {
      if (
        state.mask !== previous.mask ||
        state.splomColumns !== previous.splomColumns
      )
        draw()
    })
    return () => {
      unsubscribe()
      svg.selectAll('*').remove()
    }
  }, [ready, size.width, size.height, splomColumns])

  return (
    <section className="panel" data-testid="view-splom">
      <h2>Scatterplot matrix</h2>
      <div className="toggles">
        {COLUMNS.map((column) => (
          <label key={column}>
            <input
              type="checkbox"
              data-testid={`splom-toggle-${column}`}
              checked={splomColumns.includes(column)}
              onChange={() => useExplorer.getState().toggleSplom(column)}
            />
            {column}
          </label>
        ))}
      </div>
      <div className="chart" ref={ref}>
        <canvas ref={canvasRef} role="img" aria-label="Scatterplot matrix" />
        <svg ref={svgRef} />
      </div>
    </section>
  )
}

function drawHist(
  ctx: CanvasRenderingContext2D,
  values: Float32Array,
  domain: [number, number],
  mask: Uint8Array,
  x: number,
  y: number,
  size: number,
) {
  const bins = 40
  const all = new Array<number>(bins).fill(0)
  const focus = new Array<number>(bins).fill(0)
  const span = domain[1] - domain[0] || 1
  for (let i = 0; i < values.length; i += 1) {
    const bin = Math.floor((((values[i] ?? 0) - domain[0]) / span) * bins)
    if (bin < 0 || bin >= bins) continue
    all[bin] = (all[bin] ?? 0) + 1
    if (mask[i]) focus[bin] = (focus[bin] ?? 0) + 1
  }
  const max = Math.max(...all, 1)
  for (let i = 0; i < bins; i += 1) {
    const bh = ((all[i] ?? 0) / max) * size
    const fh = ((focus[i] ?? 0) / max) * size
    const bx = x + (i * size) / bins
    ctx.fillStyle = 'rgba(147,160,181,0.35)'
    ctx.fillRect(bx, y + size - bh, size / bins - 1, bh)
    ctx.fillStyle = 'rgba(61,220,151,0.8)'
    ctx.fillRect(bx, y + size - fh, size / bins - 1, fh)
  }
}
