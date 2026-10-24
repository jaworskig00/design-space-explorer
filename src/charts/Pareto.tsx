import { axisBottom, axisLeft } from 'd3-axis'
import { brush } from 'd3-brush'
import { line } from 'd3-shape'
import { select } from 'd3-selection'
import { useLayoutEffect, useRef } from 'react'
import {
  getTable,
  isFeasible,
  type ColumnName,
  type Direction,
} from '../data/columns.ts'
import { paretoFront } from '../lib/pareto.ts'
import { useExplorer } from '../state/explorerStore.ts'
import { MARGIN, plotSize, resizeCanvas } from './geometry.ts'
import { columnScale } from './scales.ts'
import { useSize } from './useSize.ts'

export function ParetoPlot() {
  const [ref, size] = useSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const ready = useExplorer((state) => state.ready)
  const paretoX = useExplorer((state) => state.paretoX)
  const paretoY = useExplorer((state) => state.paretoY)
  const paretoXDir = useExplorer((state) => state.paretoXDir)
  const paretoYDir = useExplorer((state) => state.paretoYDir)

  useLayoutEffect(() => {
    if (!ready || size.width < 40 || size.height < 40) return
    const canvas = canvasRef.current
    const svgElement = svgRef.current
    if (!canvas || !svgElement) return
    const table = getTable()
    const { innerWidth, innerHeight } = plotSize(size.width, size.height)
    const svg = select(svgElement)
    const draw = () => {
      const state = useExplorer.getState()
      const x = columnScale(
        table,
        state.paretoX,
        [MARGIN.left, MARGIN.left + innerWidth],
        state.paretoXDir === 'max',
      )
      const y = columnScale(
        table,
        state.paretoY,
        [MARGIN.top + innerHeight, MARGIN.top],
        state.paretoYDir === 'min',
      )
      svg.selectAll('*').remove()
      svg
        .append('g')
        .attr('transform', `translate(0,${MARGIN.top + innerHeight})`)
        .call(axisBottom(x).ticks(5))
      svg
        .append('g')
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
        .call(axisLeft(y).ticks(5))
      const feasible = new Uint8Array(table.n)
      for (let i = 0; i < table.n; i += 1)
        feasible[i] = isFeasible(table, i) ? 1 : 0
      const front = paretoFront(
        table.columns[state.paretoX],
        table.columns[state.paretoY],
        feasible,
        state.paretoXDir,
        state.paretoYDir,
      )
      const dpr = resizeCanvas(canvas, size.width, size.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const image = ctx.createImageData(canvas.width, canvas.height)
      const pixels = image.data
      const xs = table.columns[state.paretoX]
      const ys = table.columns[state.paretoY]
      const points: Array<[number, number]> = []
      for (let i = 0; i < table.n; i += 1) {
        const px = Math.round((x(xs[i] ?? 0) ?? 0) * dpr)
        const py = Math.round((y(ys[i] ?? 0) ?? 0) * dpr)
        if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height)
          continue
        const offset = (py * canvas.width + px) * 4
        const ghost = feasible[i] === 0
        const onFront = front[i] === 1
        pixels[offset] = onFront ? 244 : 147
        pixels[offset + 1] = onFront ? 247 : 160
        pixels[offset + 2] = onFront ? 251 : 181
        pixels[offset + 3] = ghost ? 40 : onFront ? 230 : 70
        if (onFront && state.mask[i])
          points.push([x(xs[i] ?? 0) ?? 0, y(ys[i] ?? 0) ?? 0])
      }
      ctx.putImageData(image, 0, 0)
      points.sort((a, b) => a[0] - b[0])
      const path = line<[number, number]>()
        .x((point) => point[0])
        .y((point) => point[1])(points)
      if (path) {
        svg
          .append('path')
          .attr('d', path)
          .attr('fill', 'none')
          .attr('stroke', '#f4f7fb')
          .attr('stroke-width', 1.5)
      }
      canvas.setAttribute(
        'aria-label',
        `Pareto front, ${state.matchCount} of ${table.n} designs`,
      )
      const plotBrush = brush().extent([
        [MARGIN.left, MARGIN.top],
        [MARGIN.left + innerWidth, MARGIN.top + innerHeight],
      ])
      plotBrush.on(
        'end',
        (event: {
          selection: [[number, number], [number, number]] | null
          sourceEvent: Event | null
        }) => {
          if (!event.sourceEvent) return
          const current = useExplorer.getState()
          if (!event.selection) {
            current.setBrush(current.paretoX, null, 'pointer')
            current.setBrush(current.paretoY, null, 'pointer')
            return
          }
          const [[x0, y0], [x1, y1]] = event.selection
          current.setBrush(
            current.paretoX,
            [x.invert(x0), x.invert(x1)],
            'pointer',
          )
          current.setBrush(
            current.paretoY,
            [y.invert(y0), y.invert(y1)],
            'pointer',
          )
        },
      )
      svg.append('g').attr('class', 'pareto-brush').call(plotBrush)
    }
    const onClick = (event: MouseEvent) => {
      const state = useExplorer.getState()
      const x = columnScale(
        table,
        state.paretoX,
        [MARGIN.left, MARGIN.left + innerWidth],
        state.paretoXDir === 'max',
      )
      const y = columnScale(
        table,
        state.paretoY,
        [MARGIN.top + innerHeight, MARGIN.top],
        state.paretoYDir === 'min',
      )
      const node = svgElement.getBoundingClientRect()
      const px = event.clientX - node.left
      const py = event.clientY - node.top
      let best = -1
      let bestDistance = 14 * 14
      const xs = table.columns[state.paretoX]
      const ys = table.columns[state.paretoY]
      for (let i = 0; i < table.n; i += 1) {
        if (!state.mask[i]) continue
        const dx = (x(xs[i] ?? 0) ?? 0) - px
        const dy = (y(ys[i] ?? 0) ?? 0) - py
        const distance = dx * dx + dy * dy
        if (distance < bestDistance) {
          bestDistance = distance
          best = i
        }
      }
      if (best >= 0) state.setSelected(best)
    }
    svgElement.addEventListener('click', onClick)
    draw()
    const unsubscribe = useExplorer.subscribe((state, previous) => {
      if (
        state.mask !== previous.mask ||
        state.paretoX !== previous.paretoX ||
        state.paretoY !== previous.paretoY ||
        state.paretoXDir !== previous.paretoXDir ||
        state.paretoYDir !== previous.paretoYDir
      ) {
        draw()
      }
    })
    return () => {
      unsubscribe()
      svgElement.removeEventListener('click', onClick)
    }
  }, [ready, size.width, size.height, paretoX, paretoY, paretoXDir, paretoYDir])

  return (
    <section className="panel" data-testid="view-pareto">
      <h2>Pareto front</h2>
      <ParetoControls />
      <div className="chart" ref={ref}>
        <canvas ref={canvasRef} role="img" aria-label="Pareto front" />
        <svg ref={svgRef} />
      </div>
    </section>
  )
}

function ParetoControls() {
  const paretoX = useExplorer((state) => state.paretoX)
  const paretoY = useExplorer((state) => state.paretoY)
  const paretoXDir = useExplorer((state) => state.paretoXDir)
  const paretoYDir = useExplorer((state) => state.paretoYDir)
  const tableReady = useExplorer((state) => state.ready)
  if (!tableReady) return null
  const table = getTable()
  const names = Object.keys(table.meta) as ColumnName[]
  return (
    <div className="inline-controls">
      <AxisSelect
        label="X"
        value={paretoX}
        names={names}
        onChange={(column) => useExplorer.getState().setParetoAxis('x', column)}
      />
      <DirSelect
        value={paretoXDir}
        onChange={(direction) =>
          useExplorer.getState().setParetoDir('x', direction)
        }
      />
      <AxisSelect
        label="Y"
        value={paretoY}
        names={names}
        onChange={(column) => useExplorer.getState().setParetoAxis('y', column)}
      />
      <DirSelect
        value={paretoYDir}
        onChange={(direction) =>
          useExplorer.getState().setParetoDir('y', direction)
        }
      />
    </div>
  )
}

function AxisSelect({
  label,
  value,
  names,
  onChange,
}: {
  label: string
  value: ColumnName
  names: ColumnName[]
  onChange: (column: ColumnName) => void
}) {
  return (
    <label>
      {label}
      <select
        aria-label={`Pareto ${label}`}
        value={value}
        onChange={(event) => onChange(event.target.value as ColumnName)}
      >
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}

function DirSelect({
  value,
  onChange,
}: {
  value: Direction
  onChange: (direction: Direction) => void
}) {
  return (
    <select
      aria-label="Objective direction"
      value={value}
      onChange={(event) => onChange(event.target.value as Direction)}
    >
      <option value="min">min</option>
      <option value="max">max</option>
    </select>
  )
}
