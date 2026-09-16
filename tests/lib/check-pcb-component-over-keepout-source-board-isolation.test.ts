import { expect, test } from "bun:test"
import { pcb_board, source_board, source_group } from "circuit-json"
import type { AnyCircuitElement } from "circuit-json"
import { checkPcbComponentOverKeepout } from "../../index"
import { component, keepout } from "../fixtures/component-keepout"

test("resolves actual core source-board ownership for overlapping board coordinates", () => {
  const hierarchy: AnyCircuitElement[] = ["a", "b"].flatMap((id) => [
    {
      ...pcb_board.parse({
        type: "pcb_board",
        pcb_board_id: `pcb_board_${id}`,
        center: { x: 0, y: 0 },
        width: 20,
        height: 20,
        thickness: 1.6,
        num_layers: 2,
      }),
      // Preserve the core-emitted field that older schema parsers strip.
      source_board_id: `source_board_${id}`,
    },
    source_board.parse({
      type: "source_board",
      source_board_id: `source_board_${id}`,
      source_group_id: `source_group_${id}`,
    }),
    source_group.parse({
      type: "source_group",
      source_group_id: `source_group_${id}`,
      subcircuit_id: `sub_${id}`,
      is_subcircuit: true,
    }),
    source_group.parse({
      type: "source_group",
      source_group_id: `source_group_child_${id}`,
      subcircuit_id: `sub_child_${id}`,
      parent_subcircuit_id: `sub_${id}`,
      parent_source_group_id: `source_group_${id}`,
      is_subcircuit: true,
    }),
  ])
  const circuitJson: AnyCircuitElement[] = [
    ...hierarchy,
    { ...component, pcb_component_id: "component_a", subcircuit_id: "sub_a" },
    {
      ...component,
      pcb_component_id: "component_b",
      subcircuit_id: "sub_child_b",
    },
    { ...keepout, pcb_keepout_id: "keepout_a", subcircuit_id: "sub_child_a" },
    { ...keepout, pcb_keepout_id: "keepout_b", subcircuit_id: "sub_b" },
  ]

  expect(
    checkPcbComponentOverKeepout(circuitJson).map(
      (error) => error.pcb_placement_error_id,
    ),
  ).toEqual([
    "component_over_keepout_component_a_keepout_a",
    "component_over_keepout_component_b_keepout_b",
  ])
})
