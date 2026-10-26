export type DrawTimings = {
  pcp?: number
  scatter?: number
  splom?: number
}

export type ExplorerRow = {
  camber: number
  camber_pos: number
  thickness: number
  alpha_deg: number
}

export type ExplorerTestApi = {
  setBrush: (column: string, range: [number, number] | null) => void
  hitTestScatter: (x: number, y: number) => number | null
  row: (id: number) => ExplorerRow | null
}

declare global {
  interface Window {
    __explorer?: ExplorerTestApi
    __timings?: DrawTimings
  }
}

export function recordDraw(name: keyof DrawTimings, started: number) {
  const timings = (window.__timings ??= {})
  timings[name] = performance.now() - started
}

export function e2eEnabled() {
  return new URLSearchParams(window.location.search).has('e2e')
}

export function publishE2E(api: ExplorerTestApi) {
  if (!e2eEnabled()) return
  window.__explorer = api
}
