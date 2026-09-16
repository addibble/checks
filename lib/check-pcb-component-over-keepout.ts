import type {
  AnyCircuitElement,
  PCBKeepout,
  PcbComponent,
  PcbPlacementError,
} from "circuit-json"
import { getPadToPadGap } from "./check-pad-clearance/common"
import { EPSILON } from "./drc-defaults"
import { getReadableNameForComponent } from "./util/get-readable-names"

/**
 * Check the conservative, board-axis-aligned component footprint on its PCB
 * layer. Core computes width/height from transformed primitives; applying the
 * component rotation again would rotate these bounds twice. This is not a CAD
 * body or courtyard check.
 */
export function checkPcbComponentOverKeepout(
  circuitJson: AnyCircuitElement[],
): PcbPlacementError[] {
  const keepouts = circuitJson.filter(
    (element): element is PCBKeepout => element.type === "pcb_keepout",
  )
  const components = circuitJson.filter(
    (element): element is PcbComponent => element.type === "pcb_component",
  )
  if (keepouts.length === 0 || components.length === 0) return []

  const sourceGroups = new Map(
    circuitJson
      .filter((element) => element.type === "source_group")
      .map((group) => [group.source_group_id, group]),
  )
  const sourceBoards = new Map(
    circuitJson
      .filter((element) => element.type === "source_board")
      .map((board) => [board.source_board_id, board]),
  )
  const boards = new Map<string, string>()
  for (const board of circuitJson) {
    if (board.type !== "pcb_board") continue
    // Core emits this relationship, but older Circuit JSON types omit it.
    const sourceBoard =
      "source_board_id" in board && typeof board.source_board_id === "string"
        ? sourceBoards.get(board.source_board_id)
        : undefined
    const subcircuitId =
      board.subcircuit_id ??
      (sourceBoard
        ? sourceGroups.get(sourceBoard.source_group_id)?.subcircuit_id
        : undefined)
    if (subcircuitId) boards.set(subcircuitId, board.pcb_board_id)
  }
  const parents = new Map(
    [...sourceGroups.values()]
      .filter((group) => group.subcircuit_id && group.parent_subcircuit_id)
      .map((group) => [group.subcircuit_id, group.parent_subcircuit_id]),
  )
  const groups = new Map(
    circuitJson
      .filter((element) => element.type === "pcb_group")
      .map((group) => [group.pcb_group_id, group]),
  )
  const sources = new Map(
    circuitJson
      .filter((element) => element.type === "source_component")
      .map((component) => [component.source_component_id, component]),
  )
  const boardFor = (element: PcbComponent | PCBKeepout) => {
    let subcircuitId =
      element.subcircuit_id ??
      (element.pcb_group_id
        ? groups.get(element.pcb_group_id)?.subcircuit_id
        : undefined) ??
      (element.type === "pcb_component"
        ? sources.get(element.source_component_id)?.subcircuit_id
        : undefined)
    const visited = new Set<string>()
    while (subcircuitId && !visited.has(subcircuitId)) {
      const boardId = boards.get(subcircuitId)
      if (boardId) return boardId
      visited.add(subcircuitId)
      subcircuitId = parents.get(subcircuitId)
    }
    return undefined
  }
  const keepoutBoards = new Map(
    keepouts.map((keepout) => [keepout.pcb_keepout_id, boardFor(keepout)]),
  )
  const errors = new Map<string, PcbPlacementError>()

  for (const component of components) {
    if (
      component.do_not_place ||
      component.width <= 0 ||
      component.height <= 0
    ) {
      continue
    }

    // Adapt the footprint to the existing shape-distance API, not to copper.
    const footprint: PCBKeepout = {
      type: "pcb_keepout",
      pcb_keepout_id: component.pcb_component_id,
      shape: "rect",
      center: component.center,
      width: component.width,
      height: component.height,
      layers: [component.layer],
    }
    const componentBoard = boardFor(component)
    const componentName =
      sources.get(component.source_component_id)?.name ||
      getReadableNameForComponent(circuitJson, component.pcb_component_id)

    for (const keepout of keepouts) {
      // Ownership exempts the inflated owner footprint, not the owner's copper.
      if (keepout.pcb_component_id === component.pcb_component_id) {
        continue
      }
      if (
        !keepout.layers.includes(component.layer) ||
        keepout.excluded_pcb_component_ids?.includes(component.pcb_component_id)
      ) {
        continue
      }
      const keepoutBoard = keepoutBoards.get(keepout.pcb_keepout_id)
      if (componentBoard && keepoutBoard && componentBoard !== keepoutBoard) {
        continue
      }
      if (getPadToPadGap(footprint, keepout) > EPSILON) continue

      const errorId = `component_over_keepout_${component.pcb_component_id}_${keepout.pcb_keepout_id}`
      errors.set(errorId, {
        type: "pcb_placement_error",
        pcb_placement_error_id: errorId,
        error_type: "pcb_placement_error",
        message: `Footprint of ${componentName} on ${component.layer} overlaps ${
          keepout.description
            ? `PCB keepout "${keepout.description}"`
            : "a PCB keepout"
        }`,
        subcircuit_id: component.subcircuit_id ?? keepout.subcircuit_id,
      })
    }
  }

  return [...errors.values()]
}
