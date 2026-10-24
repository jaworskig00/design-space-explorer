import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  testId: string
  tall?: boolean
  children?: ReactNode
}

export function Panel({ title, testId, tall = false, children }: PanelProps) {
  return (
    <section className={tall ? 'panel tall' : 'panel'} data-testid={testId}>
      <h2>{title}</h2>
      {children ?? <div className="empty">Empty — this view arrives in a later milestone.</div>}
    </section>
  )
}
