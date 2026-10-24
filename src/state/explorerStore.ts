import { create } from 'zustand'
import {
  COLUMNS,
  DEFAULT_AXES,
  DEFAULT_SPLOM,
  type ColumnName,
  type Direction,
  getTable,
} from '../data/columns.ts'
import type { UrlSnapshot } from '../lib/urlState.ts'
import { computeMask, countMask, type BrushMap } from './filter.ts'

export type BrushSource = 'pointer' | 'input'

type ExplorerState = {
  ready: boolean
  brushes: BrushMap
  brushSource: BrushSource
  axisOrder: ColumnName[]
  inverted: ColumnName[]
  scatterX: ColumnName
  scatterY: ColumnName
  paretoX: ColumnName
  paretoY: ColumnName
  paretoXDir: Direction
  paretoYDir: Direction
  colorColumn: ColumnName
  splomColumns: ColumnName[]
  histColumn: ColumnName
  hoverId: number | null
  selectedId: number | null
  mask: Uint8Array
  matchCount: number
  setReady: () => void
  setBrush: (
    column: ColumnName,
    range: [number, number] | null,
    source?: BrushSource,
  ) => void
  clearBrushes: () => void
  setHover: (id: number | null) => void
  setSelected: (id: number | null) => void
  moveAxis: (from: number, to: number) => void
  toggleInvert: (column: ColumnName) => void
  setScatterAxes: (x: ColumnName, y: ColumnName) => void
  setParetoAxis: (which: 'x' | 'y', column: ColumnName) => void
  setParetoDir: (which: 'x' | 'y', direction: Direction) => void
  setColor: (column: ColumnName) => void
  cycleColor: (delta: number) => void
  toggleSplom: (column: ColumnName) => void
  setHist: (column: ColumnName) => void
  applySnapshot: (snapshot: UrlSnapshot) => void
  cycleSelected: (delta: number) => void
  snapshot: () => UrlSnapshot
}

function withMask(brushes: BrushMap) {
  const table = getTable()
  const mask = computeMask(table, brushes)
  return { brushes, mask, matchCount: countMask(mask) }
}

const initialMask = new Uint8Array()

export const useExplorer = create<ExplorerState>((set, get) => ({
  ready: false,
  brushes: {},
  brushSource: 'input',
  axisOrder: DEFAULT_AXES,
  inverted: [],
  scatterX: 'alpha_deg',
  scatterY: 'cl',
  paretoX: 'cd',
  paretoY: 'cl',
  paretoXDir: 'min',
  paretoYDir: 'max',
  colorColumn: 'ld',
  splomColumns: DEFAULT_SPLOM,
  histColumn: 'thickness',
  hoverId: null,
  selectedId: null,
  mask: initialMask,
  matchCount: 0,
  setReady: () => {
    const next = withMask(get().brushes)
    set({ ready: true, ...next })
  },
  setBrush: (column, range, source = 'input') => {
    const brushes = { ...get().brushes }
    if (!range) delete brushes[column]
    else
      brushes[column] = [
        Math.min(range[0], range[1]),
        Math.max(range[0], range[1]),
      ]
    set({ brushSource: source, ...withMask(brushes) })
  },
  clearBrushes: () => {
    set({
      brushSource: 'input',
      selectedId: null,
      hoverId: null,
      ...withMask({}),
    })
  },
  setHover: (id) => set({ hoverId: id }),
  setSelected: (id) => set({ selectedId: id }),
  moveAxis: (from, to) => {
    const axisOrder = [...get().axisOrder]
    const [moved] = axisOrder.splice(from, 1)
    if (!moved) return
    axisOrder.splice(to, 0, moved)
    set({ axisOrder })
  },
  toggleInvert: (column) => {
    const inverted = new Set(get().inverted)
    if (inverted.has(column)) inverted.delete(column)
    else inverted.add(column)
    set({ inverted: [...inverted] })
  },
  setScatterAxes: (x, y) => set({ scatterX: x, scatterY: y }),
  setParetoAxis: (which, column) =>
    set(which === 'x' ? { paretoX: column } : { paretoY: column }),
  setParetoDir: (which, direction) =>
    set(which === 'x' ? { paretoXDir: direction } : { paretoYDir: direction }),
  setColor: (column) => set({ colorColumn: column }),
  cycleColor: (delta) => {
    const current = COLUMNS.indexOf(get().colorColumn)
    const next = COLUMNS[(current + delta + COLUMNS.length) % COLUMNS.length]
    if (next) set({ colorColumn: next })
  },
  toggleSplom: (column) => {
    const current = get().splomColumns
    const has = current.includes(column)
    const splomColumns = has
      ? current.filter((name) => name !== column)
      : [...current, column]
    if (splomColumns.length < 2) return
    set({ splomColumns })
  },
  setHist: (column) => set({ histColumn: column }),
  applySnapshot: (snapshot) => {
    set({
      ready: true,
      brushSource: 'input',
      axisOrder: snapshot.axes,
      inverted: snapshot.inverted,
      scatterX: snapshot.scatter.x,
      scatterY: snapshot.scatter.y,
      paretoX: snapshot.pareto.x,
      paretoY: snapshot.pareto.y,
      paretoXDir: snapshot.pareto.xDir,
      paretoYDir: snapshot.pareto.yDir,
      colorColumn: snapshot.color,
      splomColumns: snapshot.splom,
      histColumn: snapshot.hist,
      selectedId: snapshot.selected,
      ...withMask(snapshot.brushes),
    })
  },
  cycleSelected: (delta) => {
    const table = getTable()
    const { mask, selectedId } = get()
    const ids: number[] = []
    for (let i = 0; i < table.n; i += 1) if (mask[i]) ids.push(i)
    if (ids.length === 0) return
    const pos = selectedId == null ? -1 : ids.indexOf(selectedId)
    const next = ids[(pos + delta + ids.length) % ids.length]
    set({ selectedId: next ?? null })
  },
  snapshot: () => {
    const state = get()
    return {
      v: 1,
      brushes: state.brushes,
      axes: state.axisOrder,
      inverted: state.inverted,
      scatter: { x: state.scatterX, y: state.scatterY },
      pareto: {
        x: state.paretoX,
        y: state.paretoY,
        xDir: state.paretoXDir,
        yDir: state.paretoYDir,
      },
      color: state.colorColumn,
      splom: state.splomColumns,
      selected: state.selectedId,
      hist: state.histColumn,
    }
  },
}))
