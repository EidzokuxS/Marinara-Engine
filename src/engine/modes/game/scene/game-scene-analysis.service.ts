import type { LlmGateway } from "../../../capabilities/llm";
import type { StorageGateway } from "../../../capabilities/storage";
import type { SceneAnalysis } from "../../../contracts/types/scene";
import { parseGameJsonish } from "../../../shared/parsing-jsonish";
import {
  boolish,
  isRecord,
  parseRecord,
  readNonNegativeInteger,
  readString,
  stringArray,
  type JsonRecord,
} from "../../../generation/runtime-records";
import {
  buildSceneAnalyzerSystemPrompt,
  buildSceneAnalyzerUserPrompt,
  type SceneAnalyzerContext,
} from "./scene-analyzer";
import { postProcessSceneResult, type PostProcessContext } from "./scene-postprocess";

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

function readNullableString(value: unknown): string | null {
  const text = readString(value).trim();
  return text || null;
}

function readRecordArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter(isRecord) as T[]) : [];
}

function readGameActiveState(value: unknown): SceneAnalyzerContext["currentState"] {
  const state = readString(value).trim();
  if (state === "dialogue" || state === "combat" || state === "travel_rest") return state;
  return "exploration";
}

function normalizeSceneAnalyzerContext(value: unknown): SceneAnalyzerContext {
  const context = parseRecord(value);
  const turnNumber = readNonNegativeInteger(context.turnNumber, 0);

  return {
    currentState: readGameActiveState(context.currentState),
    ...(turnNumber > 0 ? { turnNumber } : {}),
    availableBackgrounds: stringArray(context.availableBackgrounds),
    availableSfx: stringArray(context.availableSfx),
    activeWidgets: readRecordArray<SceneAnalyzerContext["activeWidgets"][number]>(context.activeWidgets),
    trackedNpcs: readRecordArray<SceneAnalyzerContext["trackedNpcs"][number]>(context.trackedNpcs),
    characterNames: stringArray(context.characterNames),
    currentBackground: readNullableString(context.currentBackground),
    currentMusic: readNullableString(context.currentMusic),
    recentMusic: stringArray(context.recentMusic),
    useSpotifyMusic: boolish(context.useSpotifyMusic, false),
    availableSpotifyTracks: readRecordArray<NonNullable<SceneAnalyzerContext["availableSpotifyTracks"]>[number]>(
      context.availableSpotifyTracks,
    ),
    currentSpotifyTrack: readNullableString(context.currentSpotifyTrack),
    recentSpotifyTracks: stringArray(context.recentSpotifyTracks),
    currentAmbient: readNullableString(context.currentAmbient),
    currentWeather: readNullableString(context.currentWeather),
    currentTimeOfDay: readNullableString(context.currentTimeOfDay),
    canGenerateIllustrations: boolish(context.canGenerateIllustrations, false),
    canGenerateBackgrounds: boolish(context.canGenerateBackgrounds, false),
    artStylePrompt: readNullableString(context.artStylePrompt),
    imagePromptInstructions: readNullableString(context.imagePromptInstructions),
  };
}

function scenePostProcessContext(context: SceneAnalyzerContext): PostProcessContext {
  return {
    availableBackgrounds: context.availableBackgrounds,
    availableSfx: context.availableSfx,
    useSpotifyMusic: context.useSpotifyMusic,
    availableSpotifyTracks: context.availableSpotifyTracks,
    validWidgetIds: new Set(context.activeWidgets.map((widget) => readString(widget.id)).filter(Boolean)),
    characterNames: context.characterNames,
    canGenerateBackgrounds: context.canGenerateBackgrounds,
  };
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
    const sceneContext = normalizeSceneAnalyzerContext(input.context);

    const raw = await capabilities.llm.complete({
      connectionId,
      messages: [
        { role: "system", content: buildSceneAnalyzerSystemPrompt(sceneContext) },
        { role: "user", content: buildSceneAnalyzerUserPrompt(input.narration, undefined, sceneContext) },
      ],
      parameters: { maxTokens: 1200, temperature: 0.2 },
    });
    return postProcessSceneResult(sanitizeGameSceneAnalysis(parseObject(raw)), scenePostProcessContext(sceneContext));
  } catch {
    return defaultGameSceneAnalysis();
  }
}
