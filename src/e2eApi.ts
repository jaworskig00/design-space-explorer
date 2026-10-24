export type ExplorerTestApi = {
  setBrush: (column: string, range: [number, number] | null) => void
  hitTestScatter: (x: number, y: number) => number | null
}

declare global {
  interface Window {
    __explorer?: ExplorerTestApi
  }
}

export function e2eEnabled() {
  return new URLSearchParams(window.location.search).has('e2e')
}

export function publishE2E(api: ExplorerTestApi) {
  if (!e2eEnabled()) return
  window.__explorer = api
}
