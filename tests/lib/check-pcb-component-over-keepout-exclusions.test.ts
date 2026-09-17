import { expect, test } from "bun:test"
import { checkPcbComponentOverKeepout } from "../../index"
import { component, keepout } from "../fixtures/component-keepout"

test("skips excluded mounting owners, do-not-place and generated zero-size components", () => {
  expect(
    checkPcbComponentOverKeepout(
      [component],
      [
        {
          ...keepout,
          excluded_pcb_component_ids: [component.pcb_component_id],
        },
      ],
    ),
  ).toEqual([])
  for (const overrides of [
    { do_not_place: true },
    { width: 0, height: 0 },
    { width: 0 },
    { height: 0 },
  ]) {
    expect(
      checkPcbComponentOverKeepout([{ ...component, ...overrides }], [keepout]),
    ).toEqual([])
  }
  expect(
    checkPcbComponentOverKeepout(
      [component],
      [{ ...keepout, excluded_pcb_component_ids: ["another_component"] }],
    ),
  ).toHaveLength(1)
  expect(
    checkPcbComponentOverKeepout(
      [{ ...component, obstructs_within_bounds: false }],
      [keepout],
    ),
  ).toHaveLength(1)
})
