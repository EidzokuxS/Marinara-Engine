import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractJson, parseAgentResponse } from "../agent-executor.js";

describe("agent JSON extraction", () => {
  it("prefers a balanced JSON object after prose and VN bracket tags", () => {
    const raw = `
Hermit pass:

[???] [thought] [neutral]: She found the wrong shelf first.

{
  "revision": "[???] [thought] [neutral]: She found the right shelf.\\n\\nThe lamp ticks once.",
  "changed": true,
  "notes": ["Recovered from prose-prefixed output"]
}
`;

    const parsed = JSON.parse(extractJson(raw)) as { revision: string; changed: boolean; notes: string[] };

    assert.equal(parsed.changed, true);
    assert.equal(parsed.revision.includes("[???] [thought] [neutral]"), true);
    assert.deepEqual(parsed.notes, ["Recovered from prose-prefixed output"]);
  });

  it("keeps fenced JSON support", () => {
    const raw = '```json\n{"revision":"ok","changed":false,"notes":[]}\n```';

    assert.deepEqual(JSON.parse(extractJson(raw)), {
      revision: "ok",
      changed: false,
      notes: [],
    });
  });

  it("repairs trailing commas in the selected JSON object", () => {
    const raw = `
Draft follows. Ignore this line.
{"revision":"ok","changed":true,"notes":["trimmed"],}
`;

    assert.deepEqual(JSON.parse(extractJson(raw)), {
      revision: "ok",
      changed: true,
      notes: ["trimmed"],
    });
  });

  it("recovers Hermit malformed JSON before the result is marked failed", () => {
    const raw =
      '{"revision": "The door opens on dry hinges.\\n\\n[Archivist] [main] [calm]: "Come in."", "changed": true, "notes": ["Tightened hinge beat"]}';

    const parsed = parseAgentResponse({ type: "hermit", settings: {} }, raw);
    const data = parsed.data as { revision?: string; changed?: boolean; parseError?: boolean };

    assert.equal(parsed.type, "hermit_prose_revision");
    assert.equal(data.parseError, undefined);
    assert.equal(data.changed, true);
    assert.match(data.revision ?? "", /\[Archivist\] \[main\] \[calm\]: "Come in\."/);
  });
});
