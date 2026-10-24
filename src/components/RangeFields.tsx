import { useState } from 'react'
import { COLUMNS, getTable, type ColumnName } from '../data/columns.ts'
import { useExplorer } from '../state/explorerStore.ts'

export function RangeFields() {
  const ready = useExplorer((state) => state.ready)
  const brushes = useExplorer((state) => state.brushes)
  const [draft, setDraft] = useState<
    Partial<Record<ColumnName, { min: string; max: string }>>
  >({})
  if (!ready) return null
  const table = getTable()

  function commit(column: ColumnName, minText: string, maxText: string) {
    const lo = Number(minText)
    const hi = Number(maxText)
    if (
      minText === '' ||
      maxText === '' ||
      Number.isNaN(lo) ||
      Number.isNaN(hi)
    )
      return
    useExplorer.getState().setBrush(column, [lo, hi], 'input')
    setDraft((current) => {
      const next = { ...current }
      delete next[column]
      return next
    })
  }

  return (
    <form className="ranges" onSubmit={(event) => event.preventDefault()}>
      {COLUMNS.map((column) => {
        const range = brushes[column]
        const pending = draft[column]
        const min = pending?.min ?? (range ? String(range[0]) : '')
        const max = pending?.max ?? (range ? String(range[1]) : '')
        return (
          <label key={column}>
            {table.meta[column].label}
            <span>
              <input
                aria-label={`${column} minimum`}
                data-testid={`brush-${column}-min`}
                inputMode="decimal"
                value={min}
                onChange={(event) => {
                  const next = { min: event.target.value, max }
                  setDraft((current) => ({ ...current, [column]: next }))
                  commit(column, next.min, next.max)
                }}
              />
              <input
                aria-label={`${column} maximum`}
                data-testid={`brush-${column}-max`}
                inputMode="decimal"
                value={max}
                onChange={(event) => {
                  const next = { min, max: event.target.value }
                  setDraft((current) => ({ ...current, [column]: next }))
                  commit(column, next.min, next.max)
                }}
              />
            </span>
          </label>
        )
      })}
    </form>
  )
}
