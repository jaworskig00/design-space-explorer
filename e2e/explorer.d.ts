export {}

declare global {
  interface Window {
    __explorer?: {
      setBrush: (column: string, range: [number, number] | null) => void
      hitTestScatter: (x: number, y: number) => number | null
      row: (id: number) => {
        camber: number
        camber_pos: number
        thickness: number
        alpha_deg: number
      } | null
    }
    __timings?: {
      pcp?: number
      scatter?: number
      splom?: number
    }
  }
}
