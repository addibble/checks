import { expect, test } from "bun:test"
import { pcb_keepout } from "circuit-json"
import type { AnyCircuitElement, PCBKeepout } from "circuit-json"
import {
  checkPcbComponentOverKeepout,
  checkPcbCopperOverKeepout,
  runAllPlacementChecks,
} from "../../index"
import { component, keepout, source } from "../fixtures/component-keepout"

test("exempts only an explicit keepout owner's footprint, never its copper", async () => {
  const componentsAndPad: AnyCircuitElement[] = [
    source,
    component,
    { ...component, pcb_component_id: "other_component" },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "owner_pad",
      pcb_component_id: component.pcb_component_id,
      shape: "circle",
      x: 0,
      y: 0.8,
      radius: 0.2,
      layer: "bottom",
    },
  ]
  const keepouts: PCBKeepout[] = [
    keepout,
    {
      type: "pcb_keepout",
      pcb_keepout_id: "rect_keepout",
      shape: "rect",
      center: { x: 0, y: 1.6 },
      width: 2,
      height: 2,
      layers: ["bottom"],
    },
  ]

  for (const unowned of keepouts) {
    expect(
      checkPcbComponentOverKeepout([...componentsAndPad, unowned]),
    ).toHaveLength(2)
    const owned = pcb_keepout.parse({
      ...unowned,
      pcb_component_id: component.pcb_component_id,
    })
    const circuitJson = [...componentsAndPad, owned]
    const footprintErrors = checkPcbComponentOverKeepout(circuitJson)
    expect(
      footprintErrors.map((error) => error.pcb_placement_error_id),
    ).toEqual([
      `component_over_keepout_other_component_${unowned.pcb_keepout_id}`,
    ])
    const copperErrors = checkPcbCopperOverKeepout(circuitJson)
    expect(copperErrors.map((error) => error.pcb_placement_error_id)).toEqual([
      `copper_over_keepout_${component.pcb_component_id}_${unowned.pcb_keepout_id}`,
    ])
    expect(await runAllPlacementChecks(circuitJson)).toEqual(
      expect.arrayContaining([...footprintErrors, ...copperErrors]),
    )
    expect(owned.excluded_pcb_component_ids).toBeUndefined()
  }
})
