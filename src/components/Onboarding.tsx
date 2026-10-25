import { useEffect, useId, useRef } from 'react'

export function Onboarding({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') return
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="onboarding-backdrop" onClick={onClose}>
      <div
        className="onboarding"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="onboarding"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>How to explore</h2>
        <p>
          Ten thousand synthetic NACA airfoils. The outline is real geometry.
          Lift, drag, and moment come from a documented surrogate, not from a
          flow solver.
        </p>
        <ul>
          <li>
            Drag on a chart, or type a minimum and maximum. Every view filters
            together.
          </li>
          <li>
            Click a point to pin that design. Hover only highlights it. The
            outline uses the nearest NACA code, marked as nearest.
          </li>
          <li>
            On the scatter, the wheel zooms, Shift+drag pans, and a double click
            resets the view.
          </li>
          <li>Copy link shares the filter and the pinned design.</li>
        </ul>
        <p className="onboarding-keys">When you are not typing in a field:</p>
        <dl className="keys">
          <div>
            <dt>
              <kbd>→</kbd> <kbd>←</kbd>
            </dt>
            <dd>Walk the filtered designs</dd>
          </div>
          <div>
            <dt>
              <kbd>Esc</kbd>
            </dt>
            <dd>Clear the pin</dd>
          </div>
          <div>
            <dt>
              <kbd>r</kbd>
            </dt>
            <dd>Reset every filter</dd>
          </div>
          <div>
            <dt>
              <kbd>[</kbd> <kbd>]</kbd>
            </dt>
            <dd>Change the color column</dd>
          </div>
        </dl>
        <button
          ref={closeRef}
          type="button"
          data-testid="dismiss-onboarding"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
