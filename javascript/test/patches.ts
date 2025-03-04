import * as assert from "assert"
import { unstable as Automerge } from "../src"
import { type List } from "../src"

describe("patches", () => {
  describe("the patchCallback", () => {
    it("should provide access to before and after states", () => {
      const doc = Automerge.init<{ count: number }>()
      const headsBefore = Automerge.getHeads(doc)
      let headsAfter

      const newDoc = Automerge.change(
        doc,
        {
          patchCallback: (_, patchInfo) => {
            assert.deepEqual(Automerge.getHeads(patchInfo.before), headsBefore)
            headsAfter = Automerge.getHeads(patchInfo.after) // => error: recursive use of an object detected which would lead to unsafe aliasing in rust
          },
        },
        doc => {
          doc.count = 1
        }
      )
      assert.deepEqual(headsAfter, Automerge.getHeads(newDoc))
    })
  })

  describe("the diff function", () => {
    it("should return a set of patches", () => {
      const doc = Automerge.from<{ birds: string[]; fish?: string[] }>({
        birds: ["goldfinch"],
      })
      const before = Automerge.getHeads(doc)
      const newDoc = Automerge.change(doc, doc => {
        doc.birds.push("greenfinch")
        doc.fish = ["cod"] as unknown as List<string>
      })
      const after = Automerge.getHeads(newDoc)
      const patches = Automerge.diff(newDoc, before, after)
      assert.deepEqual(patches, [
        { action: "put", path: ["fish"], value: [] },
        { action: "insert", path: ["birds", 1], values: [""] },
        { action: "splice", path: ["birds", 1, 0], value: "greenfinch" },
        { action: "insert", path: ["fish", 0], values: [""] },
        { action: "splice", path: ["fish", 0, 0], value: "cod" },
      ])
    })
  })
})
