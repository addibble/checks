import { expect, test } from "bun:test"
import { checkPcbComponentOverKeepout } from "../../index"
import { EPSILON } from "../../lib/drc-defaults"
import { component, keepout } from "../fixtures/component-keepout"

test("includes tangency and EPSILON without adding another mechanical margin", () => {
  // A radius-1 boss with the caller's 0.5 mm radial clearance.
  const mountingKeepout = {
    ...keepout,
    shape: "circle" as const,
    center: { x: 0, y: 0 },
    radius: 1 + 0.5,
  }
  for (const [gap, count] of [
    [-0.1, 1],
    [0, 1],
    [EPSILON / 2, 1],
    [EPSILON * 2, 0],
    [0.1, 0],
  ]) {
    expect(
      checkPcbComponentOverKeepout(
        [
          {
            ...component,
            width: 2,
            height: 2,
            center: { x: 2.5 + gap, y: 0 },
          },
        ],
        [mountingKeepout],
      ),
    ).toHaveLength(count)
  }
})
