import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  checkPcbComponentOverKeepout,
  checkPcbCopperOverKeepout,
} from "../../index"
import { component, keepout, source } from "../fixtures/component-keepout"

test("reports the full component footprint even when its center and pads are clear", () => {
  const circuitJson: AnyCircuitElement[] = [
    source,
    component,
    keepout,
    ...[-2.7, 2.7].map(
      (x): AnyCircuitElement => ({
        type: "pcb_smtpad",
        pcb_smtpad_id: `pad_${x}`,
        pcb_component_id: component.pcb_component_id,
        shape: "circle",
        x,
        y: 0,
        radius: 0.2,
        layer: "bottom",
      }),
    ),
  ]
  expect(checkPcbCopperOverKeepout(circuitJson)).toEqual([])
  const errors = checkPcbComponentOverKeepout(circuitJson, [keepout])
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    type: "pcb_placement_error",
    error_type: "pcb_placement_error",
    pcb_placement_error_id:
      "component_over_keepout_pcb_component_u1_pcb_keepout_boss",
  })
  expect(errors[0]?.message).toContain("U1")
  expect(errors[0]?.message).toContain("bottom")
  expect(errors[0]?.message).toContain('PCB keepout "Mounting screw boss"')
  expect(
    checkPcbComponentOverKeepout([...circuitJson, ...errors], [keepout]),
  ).toEqual(errors)
})
