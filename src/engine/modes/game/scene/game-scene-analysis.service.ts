import type { LlmGateway } from "../../../capabilities/llm";
import type { StorageGateway } from "../../../capabilities/storage";
import type { SceneAnalysis } from "../../../contracts/types/scene";
import { parseGameJsonish } from "../../../shared/parsing-jsonish";
import { isRecord, parseRecord, readString, type JsonRecord } from "../../../generation/runtime-records";

export interface GameSceneAnalysisCapabilities {
  storage: StorageGateway;
  llm: LlmGateway;
}

export interface GameSceneAnalysisRequest {
  chatId?: string;
  connectionId?: string | null;
  narration: string;
  context?: JsonRecord;
}

function defaultGameSceneAnalysis(): SceneAnalysis {
  return {
    background: null,
    music: null,
    ambient: null,
    weather: null,
    timeOfDay: null,
    musicGenre: null,
    musicIntensity: null,
    locationKind: null,
    spotifyTrack: null,
    reputationChanges: [],
    segmentEffects: [],
    directions: [],
    illustration: null,
    generatedIllustration: null,
    generatedNpcAvatars: [],
  } as SceneAnalysis;
}

function copyOptional(source: JsonRecord, keys: string[]): JsonRecord {
  return Object.fromEntries(keys.filter((key) => key in source).map((key) => [key, source[key]]));
}

function sanitizeGameSceneAnalysis(parsed: JsonRecord): SceneAnalysis {
  return {
    ...defaultGameSceneAnalysis(),
    ...copyOptional(parsed, [
      "background",
      "music",
      "ambient",
      "weather",
      "timeOfDay",
      "musicGenre",
      "musicIntensity",
      "locationKind",
      "spotifyTrack",
      "illustration",
    ]),
    reputationChanges: Array.isArray(parsed.reputationChanges) ? parsed.reputationChanges : [],
    segmentEffects: Array.isArray(parsed.segmentEffects) ? parsed.segmentEffects : [],
    directions: Array.isArray(parsed.directions) ? parsed.directions : [],
  } as SceneAnalysis;
}

function parseObject(raw: string): JsonRecord {
  try {
    const parsed = parseGameJsonish(raw);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function resolveGameSceneConnectionId(
  storage: StorageGateway,
  chat: JsonRecord | null,
  override?: string | null,
): Promise<string | null> {
  const explicit = readString(override).trim();
  if (explicit) return explicit;

  const meta = parseRecord(chat?.metadata);
  const setup = parseRecord(meta.gameSetupConfig);
  const fromMetadata = readString(meta.gameSceneConnectionId).trim() || readString(setup.sceneConnectionId).trim();
  if (fromMetadata) return fromMetadata;

  const fromChat = readString(chat?.connectionId).trim();
  if (fromChat) return fromChat;

  const connections = await storage.list<JsonRecord>("connections");
  return readString(connections.find((connection) => readString(connection.provider))?.id).trim() || null;
}

export async function analyzeGameScene(
  capabilities: GameSceneAnalysisCapabilities,
  input: GameSceneAnalysisRequest,
): Promise<SceneAnalysis> {
  let chat: JsonRecord | null = null;
  try {
    chat = input.chatId ? await capabilities.storage.get<JsonRecord>("chats", input.chatId) : null;
    const connectionId = await resolveGameSceneConnectionId(capabilities.storage, chat, input.connectionId ?? null);
    const prompt = [
      "Analyze this Marinara game-mode GM narration. Return only compact JSON for the game scene renderer.",
      "Do not use roleplay-scene lifecycle semantics. Preserve game state ownership: choose visual/audio/direction metadata only.",
      "Allowed keys: background, music, ambient, weather, timeOfDay, musicGenre, musicIntensity, locationKind, spotifyTrack, reputationChanges, segmentEffects, directions, illustration.",
      "Game context JSON:",
      JSON.stringify(input.context ?? {}, null, 2).slice(0, 8000),
      "Narration:",
      input.narration,
    ].join("\n\n");

    const raw = await capabilities.llm.complete({
      connectionId,
      messages: [{ role: "user", content: prompt }],
      parameters: { maxTokens: 900, temperature: 0.2 },
    });
    return sanitizeGameSceneAnalysis(parseObject(raw));
  } catch {
    return defaultGameSceneAnalysis();
  }
}
