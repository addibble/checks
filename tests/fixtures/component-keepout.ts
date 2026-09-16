import { pcb_component, pcb_keepout } from "circuit-json"
import type { AnyCircuitElement } from "circuit-json"

export const component = pcb_component.parse({
  type: "pcb_component",
  pcb_component_id: "pcb_component_u1",
  source_component_id: "source_component_u1",
  center: { x: 0, y: 0 },
  width: 6,
  height: 2,
  layer: "bottom",
  rotation: 0,
})

export const keepout = pcb_keepout.parse({
  type: "pcb_keepout",
  pcb_keepout_id: "pcb_keepout_boss",
  shape: "circle",
  center: { x: 0, y: 1.6 },
  radius: 1,
  layers: ["bottom"],
  description: "Mounting screw boss",
})

export const source = {
  type: "source_component",
  source_component_id: "source_component_u1",
  ftype: "simple_chip",
  name: "U1",
  supplier_part_numbers: {},
} satisfies AnyCircuitElement
