import { brushX } from 'd3-brush'
import { scaleLinear } from 'd3-scale'
import { select } from 'd3-selection'
import { useLayoutEffect, useRef } from 'react'
import { getTable } from '../data/columns.ts'
import { useExplorer } from '../state/explorerStore.ts'
import { useSize } from './useSize.ts'

const BINS = 40

export function Histogram() {
  const [ref, size] = useSize<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const ready = useExplorer((state) => state.ready)
  const histColumn = useExplorer((state) => state.histColumn)

  useLayoutEffect(() => {
    if (!ready || size.width < 40 || size.height < 40) return
    const svgElement = svgRef.current
    if (!svgElement) return
    const table = getTable()
    const svg = select(svgElement)
    const draw = () => {
      const state = useExplorer.getState()
      const column = state.histColumn
      const values = table.columns[column]
      const [lo, hi] = table.meta[column].domain
      const all = new Array<number>(BINS).fill(0)
      const focus = new Array<number>(BINS).fill(0)
      const span = hi - lo || 1
      for (let i = 0; i < table.n; i += 1) {
        let bin = Math.floor((((values[i] ?? 0) - lo) / span) * BINS)
        if (bin === BINS) bin = BINS - 1
        if (bin < 0 || bin >= BINS) continue
        all[bin] = (all[bin] ?? 0) + 1
        if (state.mask[i]) focus[bin] = (focus[bin] ?? 0) + 1
      }
      const max = Math.max(...all, 1)
      const x = scaleLinear()
        .domain([lo, hi])
        .range([36, size.width - 8])
      const y = scaleLinear()
        .domain([0, max])
        .range([size.height - 20, 8])
      svgElement.setAttribute(
        'aria-label',
        `Distribution histogram, ${state.matchCount} of ${table.n} designs`,
      )
      svg.selectAll('*').remove()
      all.forEach((count, index) => {
        const x0 = x(lo + (index * span) / BINS) ?? 0
        const x1 = x(lo + ((index + 1) * span) / BINS) ?? 0
        svg
          .append('rect')
          .attr('x', x0)
          .attr('y', y(count) ?? 0)
          .attr('width', Math.max(0, x1 - x0 - 1))
          .attr('height', (y(0) ?? 0) - (y(count) ?? 0))
          .attr('fill', '#2a3340')
          .attr('data-bin-count', count)
        const focused = focus[index] ?? 0
        svg
          .append('rect')
          .attr('x', x0)
          .attr('y', y(focused) ?? 0)
          .attr('width', Math.max(0, x1 - x0 - 1))
          .attr('height', (y(0) ?? 0) - (y(focused) ?? 0))
          .attr('fill', '#3ddc97')
          .attr('data-bin-focus', focused)
      })
      const axisBrush = brushX()
        .extent([
          [36, 8],
          [size.width - 8, size.height - 20],
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
            useExplorer
              .getState()
              .setBrush(
                column,
                [x.invert(event.selection[0]), x.invert(event.selection[1])],
                'pointer',
              )
          },
        )
      svg.append('g').call(axisBrush)
    }
    draw()
    const unsubscribe = useExplorer.subscribe((state, previous) => {
      if (
        state.mask !== previous.mask ||
        state.histColumn !== previous.histColumn
      )
        draw()
    })
    return () => {
      unsubscribe()
      svg.selectAll('*').remove()
    }
  }, [ready, size.width, size.height, histColumn])

  return (
    <section className="panel" data-testid="view-histogram">
      <h2>Distributions</h2>
      <div className="chart short" ref={ref}>
        <svg ref={svgRef} role="img" aria-label="Distribution histogram" />
      </div>
    </section>
  )
}
