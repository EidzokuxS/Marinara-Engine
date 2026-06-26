import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeEmperorGameCommands } from "../tarot/emperor-commands.js";

describe("Emperor Game command normalization", () => {
  it("normalizes a single quoted choices blob into parseable choices", () => {
    const commands = normalizeEmperorGameCommands([
      `[choices: "Say you are looking for a missing tax roll.|Ask what the erased district means.|Explain that the lock opened on its own."]`,
    ]);

    assert.deepEqual(commands, [
      `[choices: "Say you are looking for a missing tax roll."|"Ask what the erased district means."|"Explain that the lock opened on its own."]`,
    ]);
  });

  it("repairs mixed quoted pipe choices from live Emperor output", () => {
    const commands = normalizeEmperorGameCommands([
      `[choices: "Press him: 'Then you'll know I was here.' Open the question of return access.|"Stand and wait — let him make the next move"|"Mark a second line, deeper in, toward the ledger's shelf — test whether he stops you"|"Answer his earlier question now, trading honesty for goodwill while his guard is down"]`,
    ]);

    assert.deepEqual(commands, [
      `[choices: "Press him: 'Then you'll know I was here.' Open the question of return access."|"Stand and wait — let him make the next move"|"Mark a second line, deeper in, toward the ledger's shelf — test whether he stops you"|"Answer his earlier question now, trading honesty for goodwill while his guard is down"]`,
    ]);
  });

  it("drops malformed multiline choices while keeping later valid commands", () => {
    const commands = normalizeEmperorGameCommands([
      `[choices: "\\"Answers about the erased district.\\""
|\\"I followed the lock.

[state: dialogue]`,
    ]);

    assert.deepEqual(commands, ["[state: dialogue]"]);
  });

  it("sanitizes readable square brackets so Note content cannot leak a tail", () => {
    const commands = normalizeEmperorGameCommands([
      "[Note: Folio heading - RENT ASSESSMENT ROLL, [Covenant Ward], dates running to current year.]",
    ]);

    assert.deepEqual(commands, [
      "[Note: Folio heading - RENT ASSESSMENT ROLL, (Covenant Ward), dates running to current year.]",
    ]);
  });

  it("rejects nested engine tags inside readable commands", () => {
    const commands = normalizeEmperorGameCommands(["[Note: The note tries to smuggle [state: combat] into prose.]"]);

    assert.deepEqual(commands, []);
  });

  it("filters commands owned by other Tarot agents", () => {
    const commands = normalizeEmperorGameCommands([
      `[skill_check: skill="Stealth" dc="15"]`,
      `[widget: threat value=4]`,
      `[inventory: action="add" item="Brass key" count="1"]`,
    ]);

    assert.deepEqual(commands, [`[inventory: action="add" item="Brass key" count="1"]`]);
  });
});
