import { useEffect, useId, useRef, useState } from 'react'
import { ShortcutList } from './ShortcutList.tsx'

export function HelpButton({ onOpenGuide }: { onOpenGuide: () => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }
      if (event.key !== '?' || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      event.preventDefault()
      setOpen((value) => !value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div className="help-dock" ref={rootRef}>
      {open ? (
        <div
          className="help-card"
          role="dialog"
          aria-labelledby={titleId}
          data-testid="help-card"
        >
          <h2 id={titleId}>Shortcuts</h2>
          <ul>
            <li>
              Drag a chart, or type a minimum and maximum. Every view filters
              together.
            </li>
            <li>Click a point to pin it. Hover only highlights it.</li>
            <li>Scatter: wheel zooms, Shift+drag pans, double-click resets.</li>
          </ul>
          <ShortcutList question="Show or hide this card" />
          <button
            type="button"
            data-testid="open-guide"
            onClick={() => {
              setOpen(false)
              onOpenGuide()
            }}
          >
            Open the full guide
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="help-fab"
        data-testid="show-help-card"
        aria-label="Shortcuts"
        aria-expanded={open}
        title="Shortcuts (?)"
        onClick={() => setOpen((value) => !value)}
      >
        ?
      </button>
    </div>
  )
}
