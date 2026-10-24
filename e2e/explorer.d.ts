export {}

declare global {
  interface Window {
    __explorer?: {
      setBrush: (column: string, range: [number, number] | null) => void
      hitTestScatter: (x: number, y: number) => number | null
    }
    __timings?: {
      pcp?: number
      scatter?: number
      splom?: number
    }
  }
}
