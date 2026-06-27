import { normalizeEmperorGameCommands } from "./emperor-commands.js";

export type EmperorScenarioExtraction = {
  scenario: string | null;
  commands: string[];
  reason: "ok" | "empty_data" | "missing_scenario";
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function scenarioFromBeats(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const beats = value.map(nonEmptyString).filter((beat): beat is string => !!beat);
  return beats.length > 0 ? beats.join("\n") : null;
}

export function extractEmperorScenario(data: unknown): EmperorScenarioExtraction {
  const record = asRecord(data);
  if (!record) return { scenario: null, commands: [], reason: "empty_data" };

  const scenario =
    nonEmptyString(record.scenario) ??
    nonEmptyString(record.turn_scenario) ??
    nonEmptyString(record.turnScenario) ??
    scenarioFromBeats(record.beats);
  const commands = normalizeEmperorGameCommands(record.commands);

  return {
    scenario,
    commands,
    reason: scenario ? "ok" : "missing_scenario",
  };
}

export function buildEmperorScenarioRepairInstruction(data: unknown): string {
  const record = asRecord(data);
  const preview =
    record && typeof record.raw === "string"
      ? record.raw.slice(0, 2000)
      : record
        ? JSON.stringify(record).slice(0, 2000)
        : String(data ?? "").slice(0, 2000);

  return [
    `<emperor_repair_request>`,
    `Your previous Emperor result did not provide a usable turn scenario. Repair your own output; do not ask Tower to infer it.`,
    `Return exactly one valid JSON object with a non-empty "scenario" string, optional "beats" array, and "commands" array.`,
    `The scenario must preserve Justice, composition context, language, and Emperor ownership. Do not write final prose.`,
    `Previous invalid Emperor output preview: ${preview}`,
    `</emperor_repair_request>`,
  ].join("\n");
}
