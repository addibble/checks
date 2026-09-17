import { expect, test } from "bun:test"
import { checkPcbComponentOverKeepout } from "../../index"
import { component, keepout, source } from "../fixtures/component-keepout"

test("checks only the explicitly selected keepouts, including an empty selection", () => {
  const selected = { ...keepout, pcb_keepout_id: "selected" }
  const circuitJson = [source, component, keepout, selected]
  expect(
    checkPcbComponentOverKeepout(circuitJson, [selected]).map(
      (error) => error.pcb_placement_error_id,
    ),
  ).toEqual(["component_over_keepout_pcb_component_u1_selected"])
  expect(checkPcbComponentOverKeepout(circuitJson, [])).toEqual([])
})
