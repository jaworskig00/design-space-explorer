export function Toolbar() {
  return (
    <header className="toolbar">
      <h1>Design Space Explorer</h1>
      <p className="counts">
        <span data-testid="filter-count">—</span>
        <span className="sr-only"> designs in the current filter</span>
      </p>
      <div className="spacer" />
      <label>
        Color
        <select aria-label="Color by" defaultValue="ld" style={{ marginLeft: 8 }}>
          <option value="ld">L/D</option>
        </select>
      </label>
      <button type="button">Reset</button>
      <button type="button">Copy link</button>
    </header>
  )
}
