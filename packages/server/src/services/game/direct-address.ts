export type GameDirectAddressMode = "party" | "gm";

const GAME_TAROT_ACTION_AGENT_TYPES = new Set(["justice", "emperor", "hermit", "chariot"]);

export function detectGameDirectAddressMode(content: string | null | undefined): GameDirectAddressMode | undefined {
  const trimmed = String(content ?? "").trimStart();
  if (trimmed.startsWith("[To the party]")) return "party";
  if (trimmed.startsWith("[To the GM]")) return "gm";
  return undefined;
}

export function isGameTarotActionAgentType(agentType: string): boolean {
  return GAME_TAROT_ACTION_AGENT_TYPES.has(agentType);
}
