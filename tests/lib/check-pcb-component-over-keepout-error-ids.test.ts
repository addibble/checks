import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  checkPcbComponentOverKeepout,
  checkPcbCopperOverKeepout,
  runAllPlacementChecks,
} from "../../index"
import { component, keepout, source } from "../fixtures/component-keepout"

test("keeps stable component/keepout IDs distinct from copper and other keepouts", async () => {
  const circuitJson: AnyCircuitElement[] = [
    source,
    component,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad",
      pcb_component_id: component.pcb_component_id,
      shape: "circle",
      x: 0,
      y: 0.8,
      radius: 0.2,
      layer: "bottom",
    },
    keepout,
    { ...keepout, pcb_keepout_id: "pcb_keepout_spacer" },
  ]
  const errors = checkPcbComponentOverKeepout(circuitJson)
  expect(errors.map((error) => error.pcb_placement_error_id)).toEqual([
    "component_over_keepout_pcb_component_u1_pcb_keepout_boss",
    "component_over_keepout_pcb_component_u1_pcb_keepout_spacer",
  ])
  expect(
    checkPcbComponentOverKeepout([...circuitJson, keepout, ...errors]),
  ).toEqual(errors)
  const copperErrors = checkPcbCopperOverKeepout(circuitJson)
  expect(copperErrors).toHaveLength(2)
  expect(await runAllPlacementChecks(circuitJson)).toEqual(
    expect.arrayContaining([...errors, ...copperErrors]),
  )
  expect(
    new Set(
      [...errors, ...copperErrors].map((error) => error.pcb_placement_error_id),
    ).size,
  ).toBe(4)
})
