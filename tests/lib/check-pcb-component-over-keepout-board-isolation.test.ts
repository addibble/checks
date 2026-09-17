import { expect, test } from "bun:test"
import { pcb_board, pcb_group } from "circuit-json"
import type { AnyCircuitElement } from "circuit-json"
import { checkPcbComponentOverKeepout } from "../../index"
import { component, keepout, source } from "../fixtures/component-keepout"

test("isolates known boards while checking sibling subcircuits and inherited owners", () => {
  const boards = ["a", "b"].map((id) =>
    pcb_board.parse({
      type: "pcb_board",
      pcb_board_id: `board_${id}`,
      subcircuit_id: `sub_${id}`,
      center: { x: 0, y: 0 },
      width: 20,
      height: 20,
      thickness: 1.6,
      num_layers: 2,
    }),
  )
  const hierarchy: AnyCircuitElement[] = [
    ...boards,
    ...["component", "keepout"].map(
      (id): AnyCircuitElement => ({
        type: "source_group",
        source_group_id: `source_group_${id}`,
        subcircuit_id: `sub_${id}`,
        parent_subcircuit_id: "sub_a",
        is_subcircuit: true,
      }),
    ),
  ]
  expect(
    checkPcbComponentOverKeepout(
      [...hierarchy, { ...component, subcircuit_id: "sub_component" }],
      [{ ...keepout, subcircuit_id: "sub_b" }],
    ),
  ).toEqual([])
  expect(
    checkPcbComponentOverKeepout(
      [...hierarchy, { ...component, subcircuit_id: "sub_component" }],
      [{ ...keepout, subcircuit_id: "sub_keepout" }],
    ),
  ).toHaveLength(1)

  const group = pcb_group.parse({
    type: "pcb_group",
    pcb_group_id: "group_keepout",
    source_group_id: "source_group_keepout",
    subcircuit_id: "sub_keepout",
    center: { x: 0, y: 0 },
    pcb_component_ids: [],
  })
  expect(
    checkPcbComponentOverKeepout(
      [...hierarchy, group, { ...source, subcircuit_id: "sub_b" }, component],
      [{ ...keepout, pcb_group_id: group.pcb_group_id }],
    ),
  ).toEqual([])
  expect(
    checkPcbComponentOverKeepout(
      [...hierarchy, group, { ...component, pcb_group_id: group.pcb_group_id }],
      [{ ...keepout, subcircuit_id: "sub_b" }],
    ),
  ).toEqual([])
})
