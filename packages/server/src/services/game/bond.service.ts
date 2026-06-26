// ----------------------------------------------
// Game: NPC Bond Registry
//
// Owns lightweight NPC identity extraction and Bond/reputation command parsing.
// Reputation math itself stays in reputation.service.ts.
// ----------------------------------------------

import { randomUUID } from "node:crypto";

import { normalizeTextForMatch, type GameNpc } from "@marinara-engine/shared";

export interface BondReputationAction {
  npcId: string;
  action: string;
  modifier?: number;
}

function parseCommandAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,\s\]]+))/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(raw)) !== null) {
    const key = match[1]?.trim().toLowerCase();
    const value = (match[2] ?? match[3] ?? match[4] ?? "").trim();
    if (key && value) attrs[key] = value;
  }
  return attrs;
}

function parseModifier(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/^\+/, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeAction(value: string | undefined): string {
  const normalized = normalizeTextForMatch(value ?? "").replace(/[^\p{L}\p{N}]+/gu, "_");
  return normalized.replace(/^_+|_+$/g, "") || "changed";
}

export function parseBondReputationCommands(text: string): BondReputationAction[] {
  const actions: BondReputationAction[] = [];
  const repRegex = /\[reputation:\s*([^\]]+)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = repRegex.exec(text)) !== null) {
    const attrs = parseCommandAttributes(match[1] ?? "");
    const npcId = (attrs.npc ?? attrs.npcid ?? attrs.id ?? attrs.name ?? "").trim();
    if (!npcId) continue;

    const modifier = parseModifier(attrs.delta ?? attrs.modifier ?? attrs.change);
    actions.push({
      npcId,
      action: normalizeAction(attrs.action ?? attrs.reason),
      ...(modifier !== undefined ? { modifier } : {}),
    });
  }
  return actions;
}

function buildBondNpcId(name: string): string {
  const key = normalizeTextForMatch(name);
  return key.replace(/[^\p{L}\p{N}]+/gu, "-") || randomUUID();
}

function createBondNpc(name: string, fields: Partial<GameNpc> = {}): GameNpc {
  return {
    id: buildBondNpcId(name),
    name,
    emoji: "👤",
    description: "",
    location: "",
    reputation: 0,
    notes: [],
    ...fields,
  };
}

export function ensureBondNpcRecords(npcs: readonly GameNpc[], npcNames: readonly string[]): GameNpc[] {
  let next = [...npcs];
  for (const rawName of npcNames) {
    const name = rawName.trim();
    const key = normalizeTextForMatch(name);
    if (!name || !key) continue;
    if (next.some((npc) => normalizeTextForMatch(npc.name) === key || normalizeTextForMatch(npc.id) === key)) continue;
    next = [...next, createBondNpc(name)];
  }
  return next;
}

export function upsertBondNpcFromCharacter(npcs: readonly GameNpc[], character: Record<string, unknown>): GameNpc[] {
  const name = typeof character.name === "string" ? character.name.trim() : "";
  if (!name) return [...npcs];

  const key = normalizeTextForMatch(name);
  if (!key) return [...npcs];

  const existingIndex = npcs.findIndex((npc) => normalizeTextForMatch(npc.name) === key);
  const appearance = typeof character.appearance === "string" ? character.appearance.trim() : "";
  const location = typeof character.location === "string" ? character.location.trim() : "";
  const avatarPath = typeof character.avatarPath === "string" ? character.avatarPath.trim() : "";

  if (existingIndex >= 0) {
    const existing = npcs[existingIndex]!;
    const next: GameNpc = {
      ...existing,
      description: existing.description || appearance,
      descriptionSource: existing.descriptionSource ?? (!existing.description && appearance ? "narration" : undefined),
      location: existing.location || location,
      avatarUrl: existing.avatarUrl ?? (avatarPath || undefined),
    };
    if (JSON.stringify(next) === JSON.stringify(existing)) return [...npcs];
    return npcs.map((npc, index) => (index === existingIndex ? next : npc));
  }

  return [
    ...npcs,
    createBondNpc(name, {
      description: appearance,
      descriptionSource: appearance ? "narration" : undefined,
      gender: typeof character.gender === "string" ? character.gender : null,
      pronouns: typeof character.pronouns === "string" ? character.pronouns : null,
      location,
      avatarUrl: avatarPath || undefined,
    }),
  ];
}
