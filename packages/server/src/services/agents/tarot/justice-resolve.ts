// ──────────────────────────────────────────────
// Tarot: Justice Resolution — harness-side dice + branch selection
// ──────────────────────────────────────────────
// Justice (the model) declares BOTH outcome branches and a DC before any
// roll. The HARNESS rolls the dice and picks the branch — the model never
// decides the random outcome. This keeps the roll honest (agents-best-practices
// principle 1: the harness acts, not the model).
// ──────────────────────────────────────────────

import type { JusticeVerdict } from "@marinara-engine/shared";
import { rollDice } from "../../game/dice.service.js";

export interface ResolvedJustice {
  branch: "auto_success" | "auto_fail" | "success" | "fail";
  /** The d20 result, or null when no roll was needed. */
  rolled: number | null;
  dc: number | null;
  /** rolled - dc, or null when no roll. */
  margin: number | null;
  /** What actually happened — the authoritative outcome fed downstream. */
  resolvedOutcome: string;
  reasoning: string;
}

/** Default harness roll: a real 1d20 via the canonical dice service. */
export const rollD20 = (): number => rollDice("1d20").total;

/**
 * Resolve a Justice verdict into a concrete outcome.
 * `roll` is injectable so the resolution logic stays deterministic in checks.
 */
export function resolveJustice(verdict: JusticeVerdict, roll: () => number = rollD20): ResolvedJustice {
  if (verdict.verdict === "auto_success") {
    return {
      branch: "auto_success",
      rolled: null,
      dc: null,
      margin: null,
      resolvedOutcome: "Действие удаётся без проверки.",
      reasoning: verdict.reasoning,
    };
  }

  if (verdict.verdict === "auto_fail") {
    return {
      branch: "auto_fail",
      rolled: null,
      dc: null,
      margin: null,
      resolvedOutcome: `Действие проваливается. ${verdict.reasoning}`.trim(),
      reasoning: verdict.reasoning,
    };
  }

  // verdict === "roll"
  const rolled = roll();
  const dc = verdict.dc ?? 10;
  const success = rolled >= dc;

  return {
    branch: success ? "success" : "fail",
    rolled,
    dc,
    margin: rolled - dc,
    resolvedOutcome: success ? (verdict.on_success ?? "Успех.") : (verdict.on_fail ?? "Провал."),
    reasoning: verdict.reasoning,
  };
}
