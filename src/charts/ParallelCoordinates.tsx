import { axisLeft } from 'd3-axis'
import { brushY } from 'd3-brush'
import { select } from 'd3-selection'
import { useLayoutEffect, useRef } from 'react'
import { getTable, type ColumnName } from '../data/columns.ts'
import { binColors, colorBin } from '../lib/colorScale.ts'
import { easeInOut, motionEnabled } from '../lib/motion.ts'
import { recordDraw } from '../e2eApi.ts'
import { useExplorer } from '../state/explorerStore.ts'
import { columnScale } from './scales.ts'
import { useSize } from './useSize.ts'

const colors = binColors()

export function ParallelCoordinates() {
  const [ref, size] = useSize<HTMLDivElement>()
  const baseRef = useRef<HTMLCanvasElement>(null)
  const hiRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const positions = useRef<number[]>([])
  const ready = useExplorer((state) => state.ready)
  const axisOrder = useExplorer((state) => state.axisOrder)
  const inverted = useExplorer((state) => state.inverted)

  useLayoutEffect(() => {
    if (!ready || size.width < 40 || size.height < 40) return
    const canvas = baseRef.current
    const highlight = hiRef.current
    const svgElement = svgRef.current
    if (!canvas || !highlight || !svgElement) return
    const table = getTable()
    const svg = select(svgElement)
    let frame = 0
    const target = axisOrder.map((_, index) => {
      const left = 40
      const right = 88
      const span = Math.max(0, size.width - left - right)
      const step = axisOrder.length === 1 ? 0 : span / (axisOrder.length - 1)
      return left + index * step
    })
    const from =
      positions.current.length === target.length
        ? [...positions.current]
        : [...target]
    const started = performance.now()
    const duration = motionEnabled() ? 300 : 0

    const drawAt = (xs: number[]) => {
      const started = performance.now()
      positions.current = xs
      const state = useExplorer.getState()
      const scales = new Map<ColumnName, ReturnType<typeof columnScale>>()
      axisOrder.forEach((column) => {
        scales.set(
          column,
          columnScale(
            table,
            column,
            [28, size.height - 16],
            state.inverted.includes(column),
          ),
        )
      })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(size.width * dpr)
      canvas.height = Math.floor(size.height * dpr)
      canvas.style.width = `${size.width}px`
      canvas.style.height = `${size.height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size.width, size.height)
      const colorValues = table.columns[state.colorColumn]
      const colorDomain = table.meta[state.colorColumn].domain
      const focused = colors.map(() => new Path2D())
      const context = new Path2D()
      for (let i = 0; i < table.n; i += 1) {
        const path =
          state.mask[i] === 1
            ? focused[colorBin(colorValues[i] ?? 0, colorDomain)]
            : context
        if (!path) continue
        axisOrder.forEach((column, index) => {
          const scale = scales.get(column)
          const y = scale?.(table.columns[column][i] ?? 0) ?? 0
          const x = xs[index] ?? 0
          if (index === 0) path.moveTo(x, y)
          else path.lineTo(x, y)
        })
      }
      ctx.globalAlpha = 0.04
      ctx.strokeStyle = '#93a0b5'
      ctx.lineWidth = 1
      ctx.stroke(context)
      ctx.globalAlpha = 0.18
      focused.forEach((path, bin) => {
        const rgb = colors[bin]
        if (!rgb) return
        ctx.strokeStyle = `rgb(${rgb.join(',')})`
        ctx.stroke(path)
      })
      ctx.globalAlpha = 1
      canvas.setAttribute(
        'aria-label',
        `Parallel coordinates, ${state.matchCount} of ${table.n} designs`,
      )

      const hi = highlight.getContext('2d')
      highlight.width = canvas.width
      highlight.height = canvas.height
      highlight.style.width = canvas.style.width
      highlight.style.height = canvas.style.height
      if (hi) {
        hi.setTransform(dpr, 0, 0, dpr, 0, 0)
        hi.clearRect(0, 0, size.width, size.height)
        const focus = state.selectedId ?? state.hoverId
        if (focus != null) {
          hi.beginPath()
          hi.strokeStyle = '#e8a838'
          hi.lineWidth = 1.6
          axisOrder.forEach((column, index) => {
            const scale = scales.get(column)
            const y = scale?.(table.columns[column][focus] ?? 0) ?? 0
            const x = xs[index] ?? 0
            if (index === 0) hi.moveTo(x, y)
            else hi.lineTo(x, y)
          })
          hi.stroke()
        }
      }

      svg.selectAll('*').remove()
      axisOrder.forEach((column, index) => {
        const scale = scales.get(column)
        if (!scale) return
        const x = xs[index] ?? 0
        const group = svg.append('g').attr('transform', `translate(${x},0)`)
        group.call(axisLeft(scale).ticks(4))
        group
          .append('text')
          .attr('y', 12)
          .attr('text-anchor', 'middle')
          .attr('fill', '#e7ecf3')
          .attr('font-size', 11)
          .text(table.meta[column].label)
          .style('cursor', 'grab')
          .on('pointerdown', (event: PointerEvent) => {
            const start = event.clientX
            const origin = index
            const move = (ev: PointerEvent) => {
              const dx = ev.clientX - start
              const next = Math.round(
                origin +
                  dx / ((size.width - 48) / Math.max(1, axisOrder.length - 1)),
              )
              const clamped = Math.max(0, Math.min(axisOrder.length - 1, next))
              if (clamped !== origin)
                useExplorer.getState().moveAxis(origin, clamped)
            }
            const up = () => {
              window.removeEventListener('pointermove', move)
              window.removeEventListener('pointerup', up)
            }
            window.addEventListener('pointermove', move)
            window.addEventListener('pointerup', up)
          })
        const button = group
          .append('text')
          .attr('y', size.height - 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#3ddc97')
          .attr('font-size', 10)
          .style('cursor', 'pointer')
          .text(state.inverted.includes(column) ? 'invert' : 'flip')
        button.on('click', () => useExplorer.getState().toggleInvert(column))
        const axisBrush = brushY()
          .extent([
            [-12, 28],
            [12, size.height - 16],
          ])
          .on(
            'end',
            (event: {
              selection: [number, number] | null
              sourceEvent: Event | null
            }) => {
              if (!event.sourceEvent) return
              if (!event.selection) {
                useExplorer.getState().setBrush(column, null, 'pointer')
                return
              }
              const [y0, y1] = event.selection
              useExplorer
                .getState()
                .setBrush(
                  column,
                  [scale.invert(y0), scale.invert(y1)],
                  'pointer',
                )
            },
          )
        const brushHost = group.append('g').call(axisBrush)
        const range = state.brushes[column]
        if (range && state.brushSource === 'input') {
          brushHost.call(
            axisBrush.move,
            [scale(range[1]), scale(range[0])].sort((a, b) => a - b) as [
              number,
              number,
            ],
          )
        }
      })
      recordDraw('pcp', started)
    }

    svgElement.dataset.motion = duration === 0 ? 'off' : 'on'
    const step = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - started) / duration)
      const eased = easeInOut(t)
      const xs = target.map(
        (value, index) =>
          (from[index] ?? value) + (value - (from[index] ?? value)) * eased,
      )
      drawAt(xs)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    const onClick = (event: MouseEvent) => {
      const hit = event.target
      if (hit instanceof Element && hit.closest('text')) return
      const rect = svgElement.getBoundingClientRect()
      const px = event.clientX - rect.left
      const py = event.clientY - rect.top
      const state = useExplorer.getState()
      const xs = positions.current.length ? positions.current : target
      const scales = axisOrder.map((column) =>
        columnScale(
          table,
          column,
          [28, size.height - 16],
          state.inverted.includes(column),
        ),
      )
      let best = -1
      let bestDistance = 8 * 8
      for (let i = 0; i < table.n; i += 1) {
        if (!state.mask[i]) continue
        let previousX = 0
        let previousY = 0
        for (let axis = 0; axis < axisOrder.length; axis += 1) {
          const column = axisOrder[axis]
          const scale = scales[axis]
          if (!column || !scale) continue
          const x = xs[axis] ?? 0
          const y = scale(table.columns[column][i] ?? 0) ?? 0
          if (axis > 0) {
            const dx = x - previousX
            const dy = y - previousY
            const length2 = dx * dx + dy * dy || 1
            const t = Math.max(
              0,
              Math.min(
                1,
                ((px - previousX) * dx + (py - previousY) * dy) / length2,
              ),
            )
            const distance =
              (previousX + t * dx - px) ** 2 + (previousY + t * dy - py) ** 2
            if (distance < bestDistance) {
              bestDistance = distance
              best = i
            }
          }
          previousX = x
          previousY = y
        }
      }
      if (best >= 0) state.setSelected(best)
    }
    svgElement.addEventListener('click', onClick)
    const unsubscribe = useExplorer.subscribe((state, previous) => {
      if (state.axisOrder !== previous.axisOrder) return
      if (
        state.mask !== previous.mask ||
        state.hoverId !== previous.hoverId ||
        state.selectedId !== previous.selectedId ||
        state.colorColumn !== previous.colorColumn ||
        state.inverted !== previous.inverted ||
        state.brushes !== previous.brushes
      ) {
        drawAt(positions.current.length ? positions.current : target)
      }
    })
    return () => {
      cancelAnimationFrame(frame)
      unsubscribe()
      svgElement.removeEventListener('click', onClick)
      svg.selectAll('*').remove()
    }
  }, [ready, size.width, size.height, axisOrder, inverted])

  return (
    <section className="panel tall" data-testid="view-pcp">
      <h2>Parallel coordinates</h2>
      <div className="chart" ref={ref}>
        <canvas ref={baseRef} role="img" aria-label="Parallel coordinates" />
        <canvas ref={hiRef} className="overlay" />
        <svg ref={svgRef} />
      </div>
    </section>
  )
}
