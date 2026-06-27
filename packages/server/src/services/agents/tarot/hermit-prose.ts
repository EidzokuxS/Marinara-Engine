import type { HermitProseRevision } from "@marinara-engine/shared";
import { normalizeVisibleProseTypography } from "../../game/segment-edits.js";

export interface HermitApplyResult {
  text: string;
  accepted: boolean;
  changed: boolean;
  reason: string | null;
  notes: string[];
}

const ENGINE_DIRECTIVE_RE =
  /\[(?:choices|qte|map_update|inventory|note|book|state|reputation|party_change|session_end|skill_check|widget|music|sfx|bg|ambient|combat|direction|dialogue|element_attack|party_add|party-turn|party-chat|dice)\b(?::[^\]]*)?\]/gi;

const VN_DIALOGUE_PREFIX_RE =
  /^\s*(\[[^\]]+\]\s*\[(?:main|side|extra|action|thought|whisper(?::[^\]]+)?)\]\s*(?:\[[^\]]+\])?\s*:)/gim;

export function normalizeHermitProseRevision(data: unknown): HermitProseRevision | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const record = data as Record<string, unknown>;
  if (record.parseError === true && typeof record.raw === "string") {
    return recoverHermitRevisionFromRaw(record.raw);
  }

  const revision =
    typeof record.revision === "string" ? record.revision : typeof record.text === "string" ? record.text : "";
  if (!revision.trim()) return null;

  const notes = Array.isArray(record.notes)
    ? record.notes
        .filter((note): note is string => typeof note === "string")
        .map((note) => note.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  return {
    revision,
    changed: typeof record.changed === "boolean" ? record.changed : true,
    notes,
  };
}

function recoverHermitRevisionFromRaw(raw: string): HermitProseRevision | null {
  const revision = extractLooseStringField(raw, "revision") ?? extractLooseStringField(raw, "text");
  if (!revision?.trim()) return null;

  const changedMatch = raw.match(/"changed"\s*:\s*(true|false)/i);
  const notes = extractLooseNotes(raw);
  if (notes.length === 0) notes.push("Recovered revision from malformed Hermit JSON.");

  return {
    revision,
    changed: changedMatch ? changedMatch[1]!.toLowerCase() === "true" : true,
    notes,
  };
}

function extractLooseStringField(raw: string, key: "revision" | "text"): string | null {
  const match = new RegExp(`"${key}"\\s*:\\s*"`, "i").exec(raw);
  if (!match) return null;

  const start = match.index + match[0].length;
  const tail = raw.slice(start);
  const endMatch = /",\s*"(?:changed|notes)"\s*:|"\s*}/i.exec(tail);
  if (!endMatch) return null;

  return decodeLooseJsonString(tail.slice(0, endMatch.index)).trim();
}

function extractLooseNotes(raw: string): string[] {
  const match = raw.match(/"notes"\s*:\s*(\[[\s\S]*?\])/i);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[1]!) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((note): note is string => typeof note === "string")
      .map((note) => note.trim())
      .filter(Boolean)
      .slice(0, 8);
  } catch {
    return [];
  }
}

function decodeLooseJsonString(value: string): string {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

export function applyHermitProseRevision(originalText: string, data: unknown): HermitApplyResult {
  const original = originalText.trim();
  const parsed = normalizeHermitProseRevision(data);
  if (!parsed) {
    return reject(original, "invalid_revision");
  }

  const parsedNotes = parsed.notes ?? [];
  const revision = normalizeVisibleProseTypography(parsed.revision.trim());
  if (!revision) {
    return reject(original, "empty_revision", parsedNotes);
  }

  const originalDirectives = extractEngineDirectives(original);
  const revisedDirectives = extractEngineDirectives(revision);
  if (!sameStringList(originalDirectives, revisedDirectives)) {
    return reject(original, "engine_directive_drift", parsedNotes);
  }

  const originalDialoguePrefixes = extractDialoguePrefixes(original);
  const revisedDialoguePrefixes = extractDialoguePrefixes(revision);
  if (!sameStringList(originalDialoguePrefixes, revisedDialoguePrefixes)) {
    return reject(original, "dialogue_prefix_drift", parsedNotes);
  }

  const maxReasonableLength = Math.max(original.length + 300, Math.floor(original.length * 1.25));
  if (original.length > 0 && revision.length > maxReasonableLength) {
    return reject(original, "revision_too_expansive", parsedNotes);
  }

  const changed = revision !== original;
  return {
    text: changed ? revision : original,
    accepted: true,
    changed,
    reason: null,
    notes: parsedNotes,
  };
}

export function extractEngineDirectives(text: string): string[] {
  return Array.from(text.matchAll(ENGINE_DIRECTIVE_RE), (match) => match[0] ?? "");
}

export function buildHermitRevisionRepairInstruction(originalText: string, reason: string | null, data: unknown): string {
  const original = originalText.trim();
  const parsed = normalizeHermitProseRevision(data);
  const originalDialoguePrefixes = extractDialoguePrefixes(original);
  const originalDirectives = extractEngineDirectives(original);
  const previousRevision = parsed?.revision.trim() ?? "";
  const notes = parsed?.notes?.length ? parsed.notes.slice(0, 6) : [];

  const parts = [
    `<hermit_repair_request>`,
    `Your previous Hermit result failed the visible prose contract: ${escapeRepairText(reason ?? "unsafe_revision")}.`,
    `Repair your own Hermit output. Keep the prose-quality edits, but preserve every mechanical surface exactly.`,
    ``,
    `Hard requirements:`,
    `- Preserve every VN dialogue prefix byte-for-byte: speaker name, lane, emotion, punctuation, and order.`,
    `- Preserve every Game engine directive byte-for-byte: no added tags, removed tags, renamed tags, or reordered tags.`,
    `- Preserve active speaker identities. Do not rename NPCs, the player, or any label from the original prose.`,
    `- Preserve VN atom format: a spoken [Name] [main|side|whisper] line contains only one quoted speech payload after the colon. Narration/action lives on its own line.`,
    `- If Tower mixed speech/action/speech inside one VN line, join the speech fragments under the existing prefix and move the action to an adjacent narration line without adding a new event.`,
    `- Return only the normal hermit_prose_revision JSON object.`,
  ];

  if (originalDialoguePrefixes.length > 0) {
    parts.push(``, `<required_vn_dialogue_prefixes>`);
    for (const prefix of originalDialoguePrefixes) parts.push(prefix);
    parts.push(`</required_vn_dialogue_prefixes>`);
  }

  if (originalDirectives.length > 0) {
    parts.push(``, `<required_engine_directives>`);
    for (const directive of originalDirectives) parts.push(directive);
    parts.push(`</required_engine_directives>`);
  }

  if (previousRevision) {
    parts.push(``, `<previous_rejected_revision_excerpt>`);
    parts.push(escapeRepairText(previousRevision.slice(0, 2500)));
    parts.push(`</previous_rejected_revision_excerpt>`);
  }

  if (notes.length > 0) {
    parts.push(``, `<previous_notes>`);
    for (const note of notes) parts.push(`- ${escapeRepairText(note)}`);
    parts.push(`</previous_notes>`);
  }

  parts.push(`</hermit_repair_request>`);
  return parts.join("\n");
}

export function extractDialoguePrefixes(text: string): string[] {
  return Array.from(text.matchAll(VN_DIALOGUE_PREFIX_RE), (match) => (match[1] ?? "").trim());
}

function escapeRepairText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sameStringList(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((entry, index) => entry === right[index]);
}

function reject(text: string, reason: string, notes: string[] = []): HermitApplyResult {
  return {
    text,
    accepted: false,
    changed: false,
    reason,
    notes,
  };
}
