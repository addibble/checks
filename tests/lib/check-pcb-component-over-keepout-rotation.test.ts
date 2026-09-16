import { expect, test } from "bun:test"
import { checkPcbComponentOverKeepout } from "../../index"
import { component, keepout } from "../fixtures/component-keepout"

test("does not rotate the component's already-transformed footprint bounds twice", () => {
  // Core's getBoundsOfPcbComponents transforms primitive corners before taking
  // the AABB: a 6x2 footprint rotated 90 degrees has width 2 and height 6.
  const rotated = { ...component, rotation: 90, width: 2, height: 6 }
  expect(
    checkPcbComponentOverKeepout([
      rotated,
      {
        ...keepout,
        shape: "circle",
        center: { x: 0, y: 2.8 },
        radius: 0.2,
      },
    ]),
  ).toHaveLength(1)
  expect(
    checkPcbComponentOverKeepout([
      rotated,
      {
        ...keepout,
        shape: "circle",
        center: { x: 2.8, y: 0 },
        radius: 0.2,
      },
    ]),
  ).toEqual([])
  expect(
    checkPcbComponentOverKeepout([
      {
        ...component,
        rotation: 45,
        width: 8 / Math.sqrt(2),
        height: 8 / Math.sqrt(2),
      },
      {
        ...keepout,
        shape: "circle",
        center: { x: 2.7, y: 2.7 },
        radius: 0.1,
      },
    ]),
  ).toHaveLength(1)
})
