import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyHermitProseRevision,
  buildHermitRevisionRepairInstruction,
  extractDialoguePrefixes,
  extractEngineDirectives,
} from "../tarot/hermit-prose.js";

describe("Hermit prose revisions", () => {
  it("accepts a compact prose-only revision", () => {
    const original = "Rain hit the stones. It was very, very quiet, and the alley felt strange.";
    const result = applyHermitProseRevision(original, {
      revision: "Rain hit the stones. Water tracked along the gutter.",
      changed: true,
      notes: ["tightened repetition"],
    });

    assert.equal(result.accepted, true);
    assert.equal(result.changed, true);
    assert.equal(result.text, "Rain hit the stones. Water tracked along the gutter.");
    assert.deepEqual(result.notes, ["tightened repetition"]);
  });

  it("rejects revisions that add or remove engine directives", () => {
    const original = "The lock gives with a dry click.";
    const result = applyHermitProseRevision(original, {
      revision: 'The lock gives with a dry click.\n\n[choices: "Enter"|"Leave"]',
      changed: true,
      notes: ["added choice"],
    });

    assert.equal(result.accepted, false);
    assert.equal(result.changed, false);
    assert.equal(result.reason, "engine_directive_drift");
    assert.equal(result.text, original);
  });

  it("normalizes em dashes as Hermit's prose sanitation contract", () => {
    const original = "A kid \u2014 five, maybe \u2014 points at your head.";
    const result = applyHermitProseRevision(original, {
      revision: original,
      changed: false,
      notes: [],
    });

    assert.equal(result.accepted, true);
    assert.equal(result.changed, true);
    assert.equal(result.text.includes("\u2014"), false);
    assert.equal(result.text, "A kid, five, maybe, points at your head.");
  });

  it("rejects revisions that change VN dialogue ownership labels", () => {
    const original = '[Ari] [main] [wary]: "Keep your hands where I can see them."';
    const result = applyHermitProseRevision(original, {
      revision: '[Ari] [side] [wary]: "Keep your hands where I can see them."',
      changed: true,
      notes: ["changed line type"],
    });

    assert.equal(result.accepted, false);
    assert.equal(result.reason, "dialogue_prefix_drift");
    assert.equal(result.text, original);
  });

  it("recognizes supported Game engine directive tags", () => {
    assert.deepEqual(extractEngineDirectives('[inventory: action="add" item="Key"]\n[party-turn]'), [
      '[inventory: action="add" item="Key"]',
      "[party-turn]",
    ]);
  });

  it("extracts VN dialogue prefixes for pre-generation Hermit protected surfaces", () => {
    assert.deepEqual(
      extractDialoguePrefixes(
        '[Yuki] [main] [wary]: "Stay back."\n\n[Ren] [thought] [focused]: Pattern first, fear later.',
      ),
      ["[Yuki] [main] [wary]:", "[Ren] [thought] [focused]:"],
    );
  });

  it("recovers malformed raw JSON when revision text contains unescaped VN dialogue quotes", () => {
    const original = 'The door opens.\n\n[Archivist] [main] [calm]: "Come in."';
    const raw =
      '{"revision": "The door opens on dry hinges.\\n\\n[Archivist] [main] [calm]: "Come in."", "changed": true, "notes": ["Tightened hinge beat"]}';

    const result = applyHermitProseRevision(original, {
      raw,
      parseError: true,
    });

    assert.equal(result.accepted, true);
    assert.equal(result.changed, true);
    assert.match(result.text, /dry hinges/);
    assert.match(result.text, /\[Archivist\] \[main\] \[calm\]: "Come in\."/);
    assert.deepEqual(result.notes, ["Tightened hinge beat"]);
  });

  it("still rejects recovered raw revisions that drift VN dialogue prefixes", () => {
    const original = '[Archivist] [main] [calm]: "Come in."';
    const raw = '{"revision": "[Archivist] [side] [calm]: "Come in."", "changed": true}';

    const result = applyHermitProseRevision(original, {
      raw,
      parseError: true,
    });

    assert.equal(result.accepted, false);
    assert.equal(result.reason, "dialogue_prefix_drift");
  });

  it("builds Hermit repair instructions with exact required dialogue prefixes", () => {
    const original = '[Yuki] [main] [excited]: "Rare Monster!"\n\n[choices: "Buy it"|"Ask"]';
    const instruction = buildHermitRevisionRepairInstruction(original, "dialogue_prefix_drift", {
      revision: '[Yuro] [main] [excited]: "Rare Monster!"\n\n[choices: "Buy it"|"Ask"]',
      changed: true,
      notes: ["speaker drift"],
    });

    assert.match(instruction, /<hermit_repair_request>/);
    assert.match(instruction, /\[Yuki\] \[main\] \[excited\]:/);
    assert.match(instruction, /\[choices: "Buy it"\|"Ask"\]/);
    assert.match(instruction, /dialogue_prefix_drift/);
    assert.match(instruction, /previous_rejected_revision_excerpt/);
  });

});
