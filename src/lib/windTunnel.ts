export const DEFAULT_WIND_TUNNEL_URL =
  'https://jaworskig00.github.io/neural-wind-tunnel/'

export type TunnelShape = {
  camber: number
  camberPos: number
  thickness: number
  alphaDeg: number
}

/** At most four decimal places, no scientific notation. */
export function formatTunnelNumber(value: number) {
  return value.toFixed(4).replace(/\.?0+$/, '')
}

/**
 * Shape-only deep link. An empty base hides the link. An omitted base uses
 * the deployed tunnel. Reynolds number and coefficients are not part of the hash.
 */
export function windTunnelHref(base: string | undefined, shape: TunnelShape) {
  const trimmed = base?.trim()
  if (trimmed === '') return null
  const root = (trimmed ?? DEFAULT_WIND_TUNNEL_URL).replace(/\/+$/, '')
  const naca = [shape.camber, shape.camberPos, shape.thickness]
    .map(formatTunnelNumber)
    .join(',')
  const alpha = formatTunnelNumber(shape.alphaDeg)
  return `${root}/#v=1&naca=${naca}&a=${alpha}&view=both`
}
