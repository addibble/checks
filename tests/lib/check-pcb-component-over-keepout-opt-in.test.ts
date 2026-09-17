import { expect, test } from "bun:test"
import {
  checkPcbComponentOverKeepout,
  runAllChecks,
  runAllPlacementChecks,
} from "../../index"
import { component, keepout, source } from "../fixtures/component-keepout"

test("general runners do not treat footprint keepouts as component obstacles", async () => {
  // A footprint's own keepout can contribute to its bounds without touching copper.
  const circuitJson = [source, component, keepout]
  const footprintErrors = checkPcbComponentOverKeepout(circuitJson, [keepout])
  expect(footprintErrors).toHaveLength(1)
  expect(await runAllPlacementChecks(circuitJson)).toEqual(
    await runAllPlacementChecks([source, component]),
  )
  expect(await runAllChecks(circuitJson)).toEqual(
    await runAllChecks([source, component]),
  )
})
