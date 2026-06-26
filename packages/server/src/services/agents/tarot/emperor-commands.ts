const MAX_COMMANDS = 12;
const MAX_CHOICE_COUNT = 8;
const MAX_CHOICE_LENGTH = 180;
const MAX_READABLE_LENGTH = 2000;

const ALLOWED_COMMAND_TAGS = new Set([
  "choices",
  "qte",
  "map_update",
  "inventory",
  "note",
  "book",
  "state",
  "reputation",
  "party_change",
  "session_end",
]);

const FORBIDDEN_COMMAND_TAGS = new Set(["skill_check", "widget"]);

const NESTED_ENGINE_TAG_RE =
  /\[(?:choices|qte|map_update|inventory|note|book|state|reputation|party_change|session_end|skill_check|widget|music|sfx|bg|ambient|combat|direction|dialogue|element_attack|party_add|party-turn|party-chat|dice)\b(?::|\])/i;

export function normalizeEmperorGameCommands(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const seen = new Set<string>();
  const commands: string[] = [];

  for (const entry of entries) {
    if (typeof entry !== "string") continue;
    for (const candidate of splitCommandCandidates(entry)) {
      const command = normalizeEmperorGameCommand(candidate);
      if (!command || seen.has(command)) continue;
      seen.add(command);
      commands.push(command);
      if (commands.length >= MAX_COMMANDS) return commands;
    }
  }

  return commands;
}

export function normalizeEmperorGameCommand(raw: string): string | null {
  const source = raw.trim();
  if (!source || source.length > MAX_READABLE_LENGTH + 32) return null;

  const parsed = parseOuterCommand(source);
  if (!parsed) return null;

  const tagName = parsed.tagName.toLowerCase();
  if (FORBIDDEN_COMMAND_TAGS.has(tagName)) return null;
  if (!ALLOWED_COMMAND_TAGS.has(tagName)) return null;

  switch (tagName) {
    case "choices":
      return normalizeChoicesCommand(parsed.body);
    case "qte":
      return normalizeQteCommand(parsed.body);
    case "note":
      return normalizeReadableCommand("Note", parsed.body);
    case "book":
      return normalizeReadableCommand("Book", parsed.body);
    case "state":
      return normalizeStateCommand(parsed.body);
    default:
      return normalizeAttributeCommand(tagName, parsed.body);
  }
}

function splitCommandCandidates(raw: string): string[] {
  const normalized = raw.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];
  if (isSingleOuterTag(normalized)) return [normalized];
  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseOuterCommand(source: string): { tagName: string; body: string } | null {
  if (isSingleOuterTag(source)) {
    const match = source.match(/^\[\s*([A-Za-z_]+)\s*:/);
    if (!match?.[1]) return null;
    const bodyStart = match[0].length;
    return {
      tagName: match[1],
      body: source.slice(bodyStart, -1).trim(),
    };
  }

  const lenientChoices = source.match(/^\[\s*(choices)\s*:\s*([\s\S]*)\]$/i);
  if (!lenientChoices?.[1]) return null;
  return {
    tagName: lenientChoices[1],
    body: (lenientChoices[2] ?? "").trim(),
  };
}

function isSingleOuterTag(source: string): boolean {
  if (!source.startsWith("[") || !source.endsWith("]")) return false;

  let depth = 0;
  let inString: '"' | "'" | null = null;
  let escaped = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (inString) {
      if (char === inString) inString = null;
      continue;
    }
    if (char === '"' || char === "'") {
      inString = char;
      continue;
    }
    if (char === "[") {
      depth += 1;
      continue;
    }
    if (char === "]") {
      depth -= 1;
      if (depth < 0) return false;
      if (depth === 0 && i !== source.length - 1) return false;
    }
  }

  return depth === 0 && inString == null;
}

function normalizeChoicesCommand(body: string): string | null {
  if (!body || /[\r\n]/.test(body) || NESTED_ENGINE_TAG_RE.test(body)) return null;

  const choices = body
    .split("|")
    .map((choice) => sanitizeChoiceText(choice))
    .filter((choice): choice is string => Boolean(choice));

  const unique = dedupe(choices).slice(0, MAX_CHOICE_COUNT);
  if (unique.length === 0) return null;

  return `[choices: ${unique.map((choice) => `"${escapeCommandQuote(choice)}"`).join("|")}]`;
}

function normalizeQteCommand(body: string): string | null {
  const cleanBody = collapseWhitespace(body);
  if (!cleanBody || NESTED_ENGINE_TAG_RE.test(cleanBody)) return null;
  const match = cleanBody.match(/^(.+?),\s*timer\s*:\s*(\d+)s?$/i);
  if (!match?.[1] || !match[2]) return null;

  const actions = dedupe(
    match[1]
      .split("|")
      .map((action) => sanitizePlainText(action, MAX_CHOICE_LENGTH))
      .filter((action): action is string => Boolean(action)),
  );
  const timer = Number.parseInt(match[2], 10);
  if (actions.length === 0 || !Number.isFinite(timer) || timer < 1 || timer > 60) return null;

  return `[qte: ${actions.join("|")}, timer: ${timer}s]`;
}

function normalizeReadableCommand(tag: "Note" | "Book", body: string): string | null {
  if (!body || NESTED_ENGINE_TAG_RE.test(body)) return null;
  const clean = collapseWhitespace(body)
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .trim();
  if (!clean || clean.length > MAX_READABLE_LENGTH) return null;
  return `[${tag}: ${clean}]`;
}

function normalizeStateCommand(body: string): string | null {
  const state = collapseWhitespace(body).toLowerCase();
  if (!/^(?:exploration|dialogue|combat|travel_rest)$/.test(state)) return null;
  return `[state: ${state}]`;
}

function normalizeAttributeCommand(tagName: string, body: string): string | null {
  const clean = collapseWhitespace(body);
  if (!clean || /[\[\]]/.test(clean) || NESTED_ENGINE_TAG_RE.test(clean)) return null;
  return `[${tagName}: ${clean}]`;
}

function sanitizeChoiceText(value: string): string | null {
  const clean = sanitizePlainText(value, MAX_CHOICE_LENGTH);
  if (!clean) return null;
  return clean.replace(/\[/g, "(").replace(/\]/g, ")");
}

function sanitizePlainText(value: string, maxLength: number): string | null {
  let clean = value
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .trim();

  while (
    clean.length >= 2 &&
    ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'")))
  ) {
    clean = clean.slice(1, -1).trim();
  }

  clean = clean.replace(/^["']+|["']+$/g, "");
  clean = collapseWhitespace(clean);
  if (!clean || clean.length > maxLength || /[\r\n]/.test(clean) || NESTED_ENGINE_TAG_RE.test(clean)) return null;
  return clean;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function escapeCommandQuote(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}
