import type { AnyCircuitElement } from "circuit-json"
import { expect, test } from "bun:test"
import { checkPcbComponentsMissingCourtyard } from "lib/check-pcb-components-missing-courtyard"

/**
 * A courtyard is the keep-out around a body on the board, so a component with
 * no extent has nothing to report.
 *
 * Zero-size PCB components are placeholders: they exist to carry an identity
 * for something that is not placed on the PCB at all -- assembly hardware, an
 * enclosure -- because a cad_component needs a pcb_component_id to point at.
 * Warning about every one of them buries the real findings, which is how a
 * check stops being read.
 */

const pcbComponent = (
  id: string,
  size: { width: number; height: number },
): AnyCircuitElement =>
  ({
    type: "pcb_component",
    pcb_component_id: id,
    source_component_id: `source_${id}`,
    center: { x: 0, y: 0 },
    layer: "top",
    rotation: 0,
    ...size,
  }) as AnyCircuitElement

test("a zero-size placeholder is not asked for a courtyard", () => {
  const warnings = checkPcbComponentsMissingCourtyard([
    pcbComponent("hardware", { width: 0, height: 0 }),
  ])
  expect(warnings).toHaveLength(0)
})

test("a real component with no courtyard is still reported", () => {
  const warnings = checkPcbComponentsMissingCourtyard([
    pcbComponent("chip", { width: 4, height: 3 }),
  ])
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.pcb_component_id).toBe("chip")
})

test("a component with extent in only one axis is still reported", () => {
  // Not a placeholder -- something with a real dimension and a missing
  // courtyard is exactly what this check exists to find.
  const warnings = checkPcbComponentsMissingCourtyard([
    pcbComponent("sliver", { width: 2, height: 0 }),
  ])
  expect(warnings).toHaveLength(1)
})
