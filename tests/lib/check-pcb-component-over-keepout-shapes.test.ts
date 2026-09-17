import { expect, test } from "bun:test"
import { pcb_keepout, type PCBKeepout } from "circuit-json"
import { checkPcbComponentOverKeepout } from "../../index"
import { component, keepout } from "../fixtures/component-keepout"

test("uses circle and polygon intersection rather than center or bounding-box overlap", () => {
  const rect = {
    type: "pcb_keepout",
    pcb_keepout_id: "rect",
    shape: "rect",
    center: { x: 3.5, y: 0 },
    width: 2,
    height: 1,
    layers: ["bottom"],
  } satisfies PCBKeepout
  expect(pcb_keepout.parse(rect)).toEqual(rect)
  expect(checkPcbComponentOverKeepout([component], [rect])).toHaveLength(1)
  expect(
    checkPcbComponentOverKeepout(
      [component],
      [{ ...rect, center: { x: 4.1, y: 0 } }],
    ),
  ).toEqual([])
  expect(
    checkPcbComponentOverKeepout(
      [component],
      [
        {
          ...keepout,
          shape: "circle",
          center: { x: 3.6, y: 1.6 },
          radius: 0.7,
        },
      ],
    ),
  ).toEqual([])

  const outline = pcb_keepout.parse({
    type: "pcb_keepout",
    pcb_keepout_id: "triangle",
    shape: "outline",
    outline: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 6 },
    ],
    stroke_width: 0,
    layers: ["bottom"],
  })
  expect(
    checkPcbComponentOverKeepout(
      [{ ...component, center: { x: 4, y: 4 }, width: 1, height: 1 }],
      [outline],
    ),
  ).toEqual([])
  expect(
    checkPcbComponentOverKeepout(
      [{ ...component, center: { x: 1, y: 1 }, width: 1, height: 1 }],
      [outline],
    ),
  ).toHaveLength(1)
})
