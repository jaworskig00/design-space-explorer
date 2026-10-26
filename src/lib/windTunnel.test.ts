import { describe, expect, it } from 'vitest'
import { windTunnelHref } from './windTunnel.ts'

const shape = {
  camber: 0.013,
  camberPos: 0.33,
  thickness: 0.071,
  alphaDeg: 4,
}

describe('wind tunnel link', () => {
  it('names the section with camber, position, thickness, and alpha', () => {
    expect(windTunnelHref(undefined, shape)).toBe(
      'https://jaworskig00.github.io/neural-wind-tunnel/#v=1&naca=0.013,0.33,0.071&a=4&view=both',
    )
  })

  it('uses a configured base and keeps out-of-range fractions as asked', () => {
    expect(
      windTunnelHref('https://example.test/tunnel/', {
        camber: 0.09,
        camberPos: 0.2,
        thickness: 0.24,
        alphaDeg: -4.5,
      }),
    ).toBe(
      'https://example.test/tunnel/#v=1&naca=0.09,0.2,0.24&a=-4.5&view=both',
    )
  })

  it('rounds to four decimals and leaves coefficients out of the hash', () => {
    const href = windTunnelHref(undefined, {
      ...shape,
      thickness: 0.123456,
    })
    expect(href).toContain('naca=0.013,0.33,0.1235')
    expect(href).not.toMatch(/reynolds|cl=|cd=|ld=/)
  })

  it('hides the link when the base is explicitly empty', () => {
    expect(windTunnelHref('', shape)).toBeNull()
    expect(windTunnelHref('   ', shape)).toBeNull()
  })
})
