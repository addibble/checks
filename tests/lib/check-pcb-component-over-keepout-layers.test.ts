import { expect, test } from "bun:test"
import { checkPcbComponentOverKeepout } from "../../index"
import { component, keepout } from "../fixtures/component-keepout"

test("checks only the component's PCB layer, including top spacer keepouts", () => {
  expect(
    checkPcbComponentOverKeepout([{ ...component, layer: "top" }], [keepout]),
  ).toEqual([])
  expect(
    checkPcbComponentOverKeepout(
      [component],
      [{ ...keepout, layers: ["top"] }],
    ),
  ).toEqual([])
  expect(
    checkPcbComponentOverKeepout(
      [component],
      [{ ...keepout, layers: ["inner1"] }],
    ),
  ).toEqual([])
  const errors = checkPcbComponentOverKeepout(
    [{ ...component, layer: "top" }],
    [{ ...keepout, layers: ["top", "bottom"], description: "Lid column" }],
  )
  expect(errors).toHaveLength(1)
  expect(errors[0]?.message).toContain("top")
  expect(errors[0]?.message).toContain("Lid column")
})
