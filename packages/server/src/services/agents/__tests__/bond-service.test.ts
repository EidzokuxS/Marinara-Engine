import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GameNpc } from "@marinara-engine/shared";
import {
  ensureBondNpcRecords,
  parseBondReputationCommands,
  upsertBondNpcFromCharacter,
} from "../../game/bond.service.js";
import { processReputationActions } from "../../game/reputation.service.js";

describe("Game Bond registry", () => {
  it("parses reputation commands from Tarot and legacy GM formats", () => {
    const actions = parseBondReputationCommands(`
      [reputation: npc="Ren" action="helped"]
      [reputation: npc="Mara", delta=-7, reason="saw the threat"]
    `);

    assert.deepEqual(actions, [
      { npcId: "Ren", action: "helped" },
      { npcId: "Mara", action: "saw_the_threat", modifier: -7 },
    ]);
  });

  it("applies parsed reputation commands through the deterministic reputation service", () => {
    const npcs: GameNpc[] = [
      {
        id: "ren",
        name: "Ren",
        emoji: "👤",
        description: "",
        location: "",
        reputation: 0,
        notes: [],
      },
    ];

    const { npcs: updated, changes } = processReputationActions(
      npcs,
      parseBondReputationCommands('[reputation: npc="Ren" action="helped"]'),
    );

    assert.equal(updated[0]?.reputation, 15);
    assert.deepEqual(changes.map((change) => [change.npcName, change.action, change.change]), [["Ren", "helped", 15]]);
  });

  it("creates placeholder NPC records before applying reputation to newly mentioned characters", () => {
    const actions = parseBondReputationCommands('[reputation: npc="Mara Vale" delta=+6 reason="fair deal"]');
    const ensured = ensureBondNpcRecords([], actions.map((action) => action.npcId));
    const { npcs: updated } = processReputationActions(ensured, actions);

    assert.equal(updated[0]?.id, "mara-vale");
    assert.equal(updated[0]?.name, "Mara Vale");
    assert.equal(updated[0]?.reputation, 6);
  });

  it("upserts present scene characters into the tracked NPC registry without overwriting canonical profiles", () => {
    const existing: GameNpc[] = [
      {
        id: "ren",
        name: "Ren",
        emoji: "👤",
        description: "A canonical fixer from setup.",
        descriptionSource: "model",
        location: "",
        reputation: 0,
        notes: [],
      },
    ];

    const updated = upsertBondNpcFromCharacter(existing, {
      name: "Ren",
      appearance: "Tall silhouette in a wet coat.",
      location: "old station",
      avatarPath: "/sprites/ren.png",
    });
    const inserted = upsertBondNpcFromCharacter(updated, {
      name: "Mara Vale",
      appearance: "A courier with oil-black gloves.",
      location: "platform",
    });

    assert.equal(updated[0]?.description, "A canonical fixer from setup.");
    assert.equal(updated[0]?.location, "old station");
    assert.equal(updated[0]?.avatarUrl, "/sprites/ren.png");
    assert.equal(inserted[1]?.id, "mara-vale");
    assert.equal(inserted[1]?.descriptionSource, "narration");
  });
});
