export const MARGIN = { top: 16, right: 16, bottom: 32, left: 48 }

export function plotSize(width: number, height: number) {
  return {
    innerWidth: Math.max(10, width - MARGIN.left - MARGIN.right),
    innerHeight: Math.max(10, height - MARGIN.top - MARGIN.bottom),
  }
}

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.floor(width * dpr))
  canvas.height = Math.max(1, Math.floor(height * dpr))
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  return dpr
}
