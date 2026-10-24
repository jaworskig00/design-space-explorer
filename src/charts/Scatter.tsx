import { brush } from 'd3-brush'
import { Delaunay } from 'd3-delaunay'
import { quadtree } from 'd3-quadtree'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom'
import { useLayoutEffect, useRef } from 'react'
import { axisBottom, axisLeft } from 'd3-axis'
import { getTable, type ColumnName } from '../data/columns.ts'
import { binColors, colorBin } from '../lib/colorScale.ts'
import { publishE2E, recordDraw } from '../e2eApi.ts'
import { useExplorer } from '../state/explorerStore.ts'
import { MARGIN, plotSize, resizeCanvas } from './geometry.ts'
import { columnScale } from './scales.ts'
import { useSize } from './useSize.ts'

const colors = binColors()

export function ScatterPlot() {
  const hostRef = useSize<HTMLDivElement>()
  const [ref, size] = hostRef
  const baseRef = useRef<HTMLCanvasElement>(null)
  const hiRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const ready = useExplorer((state) => state.ready)
  const scatterX = useExplorer((state) => state.scatterX)
  const scatterY = useExplorer((state) => state.scatterY)

  useLayoutEffect(() => {
    if (!ready || size.width < 40 || size.height < 40) return
    const canvas = baseRef.current
    const highlight = hiRef.current
    const svgElement = svgRef.current
    if (!canvas || !highlight || !svgElement) return
    const table = getTable()
    const { innerWidth, innerHeight } = plotSize(size.width, size.height)
    const svg = select(svgElement)
    svg.selectAll('*').remove()
    const xAxisG = svg
      .append('g')
      .attr('transform', `translate(0,${MARGIN.top + innerHeight})`)
    const yAxisG = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
    const brushG = svg.append('g').attr('class', 'brush')
    let transform: ZoomTransform = zoomIdentity
    let findPoint: (x: number, y: number) => number | null = () => null

    const draw = () => {
      const started = performance.now()
      const state = useExplorer.getState()
      const x = columnScale(
        table,
        state.scatterX,
        [MARGIN.left, MARGIN.left + innerWidth],
        state.inverted.includes(state.scatterX),
      )
      const y = columnScale(
        table,
        state.scatterY,
        [MARGIN.top + innerHeight, MARGIN.top],
        state.inverted.includes(state.scatterY),
      )
      const zx = transform.rescaleX(x)
      const zy = transform.rescaleY(y)
      xAxisG.call(axisBottom(zx).ticks(5))
      yAxisG.call(axisLeft(zy).ticks(5))
      const dpr = resizeCanvas(canvas, size.width, size.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const image = ctx.createImageData(canvas.width, canvas.height)
      const pixels = image.data
      const xs = table.columns[state.scatterX]
      const ys = table.columns[state.scatterY]
      const colorDomain = table.meta[state.colorColumn].domain
      const colorValues = table.columns[state.colorColumn]
      const ids: number[] = []
      const coords: number[] = []
      for (let i = 0; i < table.n; i += 1) {
        const px = Math.round((zx(xs[i] ?? 0) ?? 0) * dpr)
        const py = Math.round((zy(ys[i] ?? 0) ?? 0) * dpr)
        if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height)
          continue
        const offset = (py * canvas.width + px) * 4
        const on = state.mask[i] === 1
        const rgb = on
          ? colors[colorBin(colorValues[i] ?? 0, colorDomain)]
          : [120, 132, 148]
        pixels[offset] = rgb?.[0] ?? 120
        pixels[offset + 1] = rgb?.[1] ?? 132
        pixels[offset + 2] = rgb?.[2] ?? 148
        pixels[offset + 3] = on ? 210 : 36
        if (on) {
          ids.push(i)
          coords.push(zx(xs[i] ?? 0) ?? 0, zy(ys[i] ?? 0) ?? 0)
        }
      }
      ctx.putImageData(image, 0, 0)
      if (ids.length > 0 && ids.length <= 4000) {
        const delaunay = new Delaunay(Float64Array.from(coords))
        findPoint = (px, py) => {
          const index = delaunay.find(px, py)
          return ids[index] ?? null
        }
      } else {
        const tree = quadtree<number>()
          .x((index) => zx(xs[index] ?? 0) ?? 0)
          .y((index) => zy(ys[index] ?? 0) ?? 0)
        tree.addAll(ids)
        findPoint = (px, py) => tree.find(px, py, 14) ?? null
      }
      canvas.setAttribute(
        'aria-label',
        `Focused scatter, ${state.matchCount} of ${table.n} designs`,
      )
      recordDraw('scatter', started)
      const hi = highlight.getContext('2d')
      const hdpr = resizeCanvas(highlight, size.width, size.height)
      if (!hi) return
      hi.setTransform(hdpr, 0, 0, hdpr, 0, 0)
      hi.clearRect(0, 0, size.width, size.height)
      const focus = state.selectedId ?? state.hoverId
      if (focus != null) {
        hi.fillStyle = '#e8a838'
        hi.beginPath()
        hi.arc(
          zx(xs[focus] ?? 0) ?? 0,
          zy(ys[focus] ?? 0) ?? 0,
          4,
          0,
          Math.PI * 2,
        )
        hi.fill()
      }
    }

    const xyBrush = brush()
      .extent([
        [MARGIN.left, MARGIN.top],
        [MARGIN.left + innerWidth, MARGIN.top + innerHeight],
      ])
      .on(
        'end',
        (event: {
          selection: [[number, number], [number, number]] | null
          sourceEvent: Event | null
        }) => {
          if (!event.sourceEvent) return
          const state = useExplorer.getState()
          if (!event.selection) {
            state.setBrush(state.scatterX, null, 'pointer')
            state.setBrush(state.scatterY, null, 'pointer')
            return
          }
          const x = columnScale(
            table,
            state.scatterX,
            [MARGIN.left, MARGIN.left + innerWidth],
            false,
          )
          const y = columnScale(
            table,
            state.scatterY,
            [MARGIN.top + innerHeight, MARGIN.top],
            false,
          )
          const zx = transform.rescaleX(x)
          const zy = transform.rescaleY(y)
          const [[x0, y0], [x1, y1]] = event.selection
          state.setBrush(
            state.scatterX,
            [zx.invert(x0), zx.invert(x1)],
            'pointer',
          )
          state.setBrush(
            state.scatterY,
            [zy.invert(y0), zy.invert(y1)],
            'pointer',
          )
        },
      )
    const zoomer = zoom<SVGSVGElement, unknown>()
      .filter((event: Event) => {
        const mouse = event as MouseEvent
        if (event.type === 'dblclick') return false
        if (event.type === 'mousedown' && !mouse.shiftKey) return false
        return mouse.button === undefined || mouse.button === 0
      })
      .on('zoom', (event: { transform: ZoomTransform }) => {
        transform = event.transform
        draw()
      })
    svg.call(zoomer)
    brushG.call(xyBrush)
    brushG.raise()
    svg.on('dblclick', (event: MouseEvent) => {
      event.preventDefault()
      svg.call(zoomer.transform, zoomIdentity)
    })
    svg.on('mousemove', (event: MouseEvent) => {
      const pointer = [event.offsetX, event.offsetY] as const
      useExplorer.getState().setHover(findPoint(pointer[0], pointer[1]))
    })
    svg.on('mouseleave', () => useExplorer.getState().setHover(null))
    svg.on('click', (event: MouseEvent) => {
      if (event.shiftKey) return
      const id = findPoint(event.offsetX, event.offsetY)
      if (id != null) useExplorer.getState().setSelected(id)
    })

    publishE2E({
      setBrush: (column, range) => {
        if (column in table.columns) {
          useExplorer.getState().setBrush(column as ColumnName, range, 'input')
        }
      },
      hitTestScatter: (x, y) => findPoint(x, y),
    })

    draw()
    const unsubscribe = useExplorer.subscribe((state, previous) => {
      if (
        state.mask !== previous.mask ||
        state.hoverId !== previous.hoverId ||
        state.selectedId !== previous.selectedId ||
        state.colorColumn !== previous.colorColumn ||
        state.inverted !== previous.inverted
      ) {
        draw()
      }
    })
    return () => {
      unsubscribe()
      svg.on('.zoom', null)
      brushG.on('.brush', null)
      svg.on('mousemove', null)
      svg.on('mouseleave', null)
      svg.on('click', null)
      svg.on('dblclick', null)
    }
  }, [ready, size.width, size.height, scatterX, scatterY])

  return (
    <section
      className="panel"
      data-testid="view-scatter"
      aria-label="Focused scatter"
    >
      <h2>Focused scatter</h2>
      <div className="chart" ref={ref}>
        <canvas
          ref={baseRef}
          role="img"
          aria-label="Focused scatter of the filtered designs"
        />
        <canvas ref={hiRef} className="overlay" />
        <svg ref={svgRef} />
      </div>
    </section>
  )
}
