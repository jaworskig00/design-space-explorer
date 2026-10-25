export function ShortcutList({ question }: { question: string }) {
  return (
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
      <div>
        <dt>
          <kbd>?</kbd>
        </dt>
        <dd>{question}</dd>
      </div>
    </dl>
  )
}
