import { quadtree } from 'd3-quadtree'
import { expect, it } from 'vitest'

it('returns the fixture index nearest the query', () => {
  const points = [
    [0, 0],
    [10, 10],
    [3, 4],
  ]
  const tree = quadtree<number>()
    .x((index) => points[index]?.[0] ?? 0)
    .y((index) => points[index]?.[1] ?? 0)
  tree.addAll([0, 1, 2])
  expect(tree.find(3.1, 4.1, 2)).toBe(2)
})
