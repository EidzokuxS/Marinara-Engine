import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  GAME_TAROT_DEFAULT_AGENT_IDS,
  getDefaultAgentPrompt,
  isAgentAvailableInChatMode,
  type AgentContext,
} from "@marinara-engine/shared";
import {
  buildGmSystemPrompt,
  buildGmFormatReminder,
  buildSetupPrompt,
  buildTowerNarrativeSystemPrompt,
  type GmPromptContext,
} from "../../game/gm-prompts.js";
import { buildAgentExtras } from "../agent-executor.js";

function baseAgentContext(memory: Record<string, unknown>): AgentContext {
  return {
    chatId: "chat-1",
    chatMode: "game",
    recentMessages: [],
    mainResponse: null,
    gameState: null,
    characters: [],
    persona: null,
    memory,
    activatedLorebookEntries: null,
    writableLorebookIds: null,
    chatSummary: null,
    streaming: false,
    signal: new AbortController().signal,
  };
}

function towerContext(): GmPromptContext {
  return {
    gameActiveState: "exploration",
    storyArc: "SECRET_ARC_ONLY_FOR_EMPEROR",
    plotTwists: ["SECRET_TWIST_ONLY_FOR_EMPEROR"],
    campaignPlan: {
      openingSituation: "SECRET_OPENING_PLAN",
      pressureClocks: [],
      factions: [],
      questSeeds: ["SECRET_QUEST_SEED"],
      encounterPrinciples: ["SECRET_ENCOUNTER_RULE"],
    },
    map: {
      type: "node",
      name: "Visible District",
      description: "Rain-bright rooftops",
      partyPosition: "square",
      nodes: [
        {
          id: "square",
          emoji: "S",
          label: "Market Square",
          x: 10,
          y: 20,
          description: "A public plaza",
          discovered: true,
        },
        {
          id: "vault",
          emoji: "V",
          label: "SECRET_MAP_NODE",
          x: 80,
          y: 20,
          description: "Hidden route",
          discovered: false,
        },
      ],
      edges: [{ from: "square", to: "vault" }],
    },
    npcs: [
      {
        id: "spy",
        name: "OFFSCREEN_TRACKED_NPC",
        emoji: "NPC",
        description: "Should remain in Emperor composition context, not Tower",
        descriptionSource: "user",
        gender: null,
        pronouns: null,
        location: "Elsewhere",
        reputation: 0,
        notes: ["SECRET_NPC_NOTE"],
        avatarUrl: null,
      },
    ],
    sessionSummaries: [
      {
        sessionNumber: 1,
        summary: "SECRET_SESSION_SUMMARY",
        resumePoint: "SECRET_RESUME_POINT",
        partyDynamics: "",
        partyState: "",
        keyDiscoveries: [],
        characterMoments: [],
        littleDetails: [],
        statsSnapshot: {},
        npcUpdates: [],
        nextSessionRequest: null,
        timestamp: "2026-06-03T00:00:00.000Z",
      },
    ],
    sessionNumber: 2,
    partyNames: ["Ari"],
    partyCards: [{ name: "Ari", card: "Name: Ari\nPersonality: blunt guardian" }],
    referenceCharacterIndex: ["FUTURE_REFERENCE_CAST: should stay off Tower"],
    referenceCharacterCards: [],
    presentCharacterNames: ["Ari"],
    playerName: "Player",
    playerCard: "Name: Player\nDescription: careful thief",
    gmCharacterCard: null,
    difficulty: "hard",
    genre: "fantasy",
    setting: "canal city",
    tone: "tense",
    gameTime: "Day 2, midnight",
    weatherContext: "Current weather: rain",
    playerNotes: "SECRET_PLAYER_NOTE",
    hudWidgets: [{ id: "threat", type: "counter", label: "Threat", position: "hud_left", config: { count: 3 } }],
    chariotHandlesWidgets: true,
    justiceHandlesAdjudication: true,
    rating: "sfw",
    hasSceneModel: false,
    canGenerateBackgrounds: true,
    artStylePrompt: "SECRET_ART_STYLE",
    playerMoved: false,
    turnNumber: 4,
    playerInventory: [{ name: "SECRET_INVENTORY_ITEM", quantity: 1 }],
    language: "English",
  };
}

describe("Tarot context routing", () => {
  it("keeps Tower's narrative prompt free of Emperor/Justice/Chariot ownership context", () => {
    const prompt = buildTowerNarrativeSystemPrompt(towerContext());

    assert.match(prompt, /You are Tower, the narrative renderer/);
    assert.match(prompt, /Market Square/);
    assert.match(prompt, /Ari/);

    assert.doesNotMatch(prompt, /SECRET_ARC_ONLY_FOR_EMPEROR/);
    assert.doesNotMatch(prompt, /SECRET_TWIST_ONLY_FOR_EMPEROR/);
    assert.doesNotMatch(prompt, /SECRET_QUEST_SEED/);
    assert.doesNotMatch(prompt, /SECRET_MAP_NODE/);
    assert.doesNotMatch(prompt, /OFFSCREEN_TRACKED_NPC/);
    assert.doesNotMatch(prompt, /SECRET_PLAYER_NOTE/);
    assert.doesNotMatch(prompt, /SECRET_INVENTORY_ITEM/);
    assert.doesNotMatch(prompt, /SECRET_ART_STYLE/);
    assert.doesNotMatch(prompt, /FUTURE_REFERENCE_CAST/);
    assert.doesNotMatch(prompt, /HUD WIDGETS/);
    assert.doesNotMatch(prompt, /COMMANDS:/);
    assert.doesNotMatch(prompt, /Emit commands when canonical game or UI state changes/);
    assert.match(prompt, /engine command tags .* are forbidden/);
    assert.match(prompt, /<visible_scene_contract>/);
    assert.match(prompt, /Player agency:/);
    assert.match(prompt, /VN line grammar:/);
    assert.match(prompt, /<humanizer_deslop>/);
    assert.match(prompt, /<forward_motion>/);
    assert.match(prompt, /Tower role: unbiased cinematographer and narrative renderer/);
    assert.doesNotMatch(prompt, /Role: unbiased cinematographer, DM, GM; controls NPCs and the world/);
  });

  it("keeps the Onyx adult/prose contract in Tower without restoring command ownership", () => {
    const prompt = buildTowerNarrativeSystemPrompt({ ...towerContext(), rating: "nsfw" });

    assert.match(prompt, /<stage_terms_handshake>/);
    assert.match(prompt, /Zetta Onyx v1\.55 handshake adaptation/);
    assert.match(prompt, /fiction is authorized to run at full force/);
    assert.match(prompt, /Character Force applies/);
    assert.match(prompt, /player accepts, fully informed/);
    assert.match(prompt, /<adult_mode>/);
    assert.match(prompt, /Freaky-Balanced Mode/);
    assert.match(prompt, /This mode is active all the time in NSFW games/);
    assert.match(prompt, /lewd physical attention enter every scene/);
    assert.match(prompt, /Describe characters lewdly and directly/);
    assert.match(prompt, /Never repeat adult physical details already registered/);
    assert.match(prompt, /sex\/intimacy enter through established charge/i);
    assert.match(prompt, /<time_accuracy>/);
    assert.match(prompt, /<time_skip_engine>/);
    assert.match(prompt, /<zt_state_writer_adaptation>/);
    assert.match(prompt, /Tower never appends ZT_STATE HTML comments/);
    assert.match(prompt, /SillyTavern bracket header/);
    assert.match(prompt, /<zt_prose_bans>/);
    assert.match(prompt, /Tower role: unbiased cinematographer and narrative renderer/);

    assert.doesNotMatch(prompt, /HUD WIDGETS/);
    assert.doesNotMatch(prompt, /COMMANDS:/);
    assert.doesNotMatch(prompt, /Widget usage/);
    assert.doesNotMatch(prompt, /Chariot owns HUD widget updates/);
    assert.doesNotMatch(prompt, /Role: unbiased cinematographer, DM, GM; controls NPCs and the world/);
  });

  it("places the adapted BOLT audit next to Game output formatting", () => {
    const reminder = buildGmFormatReminder({
      hasSceneModel: false,
      canGenerateBackgrounds: false,
      hudWidgets: [],
      chariotHandlesWidgets: true,
      justiceHandlesAdjudication: true,
      gameActiveState: "exploration",
      sessionNumber: 1,
      gameTime: "Day 1, 21:10",
      weatherContext: "Current weather: fog",
      map: null,
      partyNames: ["Ari"],
      playerName: "Player",
      rating: "nsfw",
      towerNarrativeOnly: true,
    });

    assert.match(reminder, /<bolt_private_turn_audit>/);
    assert.match(reminder, /BOLT v2 private writing room \(adapted from Zetta Onyx v1\.55\)/);
    assert.match(reminder, /<visible_scene_contract>/);
    assert.match(reminder, /PLAN \/ SCOUT/);
    assert.match(reminder, /PLAN \/ TIME/);
    assert.match(reminder, /private time math/);
    assert.match(reminder, /PLAN \/ DIRECTOR/);
    assert.match(reminder, /Offscreen named NPCs and established factions keep living/);
    assert.match(reminder, /Tower renders only convergence already present in <turn_scenario>/);
    assert.match(reminder, /current clock \(Day 1, 21:10\)/);
    assert.match(reminder, /weather\/location context \(Current weather: fog\)/);
    assert.match(reminder, /<time_skip_engine>/);
    assert.match(reminder, /DRAFT \/ PROSE/);
    assert.match(reminder, /AUDIT \/ Force/);
    assert.match(reminder, /AUDIT \/ Slop/);
    assert.match(reminder, /<humanizer_deslop>/);
    assert.match(reminder, /<banned_vocabulary>/);
    assert.match(reminder, /<do_not_repeat_descriptions>/);
    assert.match(reminder, /Freaky-Balanced adult routing/);
    assert.match(reminder, /adult register is active in every NSFW scene/);
    assert.match(reminder, /sex\/intimacy stay slow-burn and require established charge/);
    assert.match(reminder, /Tower renders prose only/);
    assert.match(reminder, /ZT_STATE HTML comments/);
    assert.match(reminder, /never bare standalone italic lines in Game/);
    assert.match(reminder, /Do not emit engine command tags/);
    assert.match(reminder, /write \[Player\] \[thought\]/);
    assert.match(reminder, /VN lines: \[Name\] \[main\|side\|whisper:Target\]/);
    assert.match(reminder, /\[Name\] \[side\] \[thinking\] is spoken or visible aside/);
    assert.match(reminder, /Run a humanizer\/deslop pass before final output/);
    assert.doesNotMatch(reminder, /\[Player\] \[main\]/);
    assert.doesNotMatch(reminder, /You think to yourself/);
    assert.match(reminder, /<output_format>/);
  });

  it("keeps full GM and Tower prompts on one visible scene contract", () => {
    const fullPrompt = buildGmSystemPrompt({ ...towerContext(), gmCharacterCard: "GM persona card" });
    const towerPrompt = buildTowerNarrativeSystemPrompt(towerContext());

    for (const prompt of [fullPrompt, towerPrompt]) {
      assert.match(prompt, /<visible_scene_contract>/);
      assert.match(prompt, /Player agency:/);
      assert.match(prompt, /NPC interiority:/);
      assert.match(prompt, /Long-run prose hygiene:/);
      assert.match(prompt, /<humanizer_deslop>/);
      assert.doesNotMatch(prompt, /filtered through their subjective lenses/);
      assert.doesNotMatch(prompt, /thought\/action format/);
      assert.doesNotMatch(prompt, /That's what you want to say/);
    }
  });

  it("adds Onyx world-design pressure to setup without making reference cast party members", () => {
    const prompt = buildSetupPrompt({
      rating: "nsfw",
      playerName: "Player",
      partyNames: ["Ari"],
      referenceCharacterIndex: ["Future Canon: offscreen antagonist"],
    });

    assert.match(prompt, /<onyx_world_design_contract>/);
    assert.match(prompt, /Use Freaky-Balanced adult mode/);
    assert.match(prompt, /Reference cast remains optional future cast/);
    assert.match(prompt, /Allowed characterCards names: Player, Ari/);
    assert.match(prompt, /Future Canon: offscreen antagonist/);
    assert.match(prompt, /Do NOT put them all in startingNpcs/);
  });

  it("exposes Tarot context packets only to their owning agents", () => {
    const memory = {
      _justiceAdjudicationContext: { marker: "JUSTICE_PACKET" },
      _emperorCompositionContext: { marker: "EMPEROR_PACKET" },
      _activeHudWidgets: [
        { id: "threat", type: "counter", label: "Threat", position: "hud_left", config: { count: 3 } },
      ],
      _tarotLoreContext: "LORE_FOR_JUSTICE_AND_EMPEROR",
    };

    const justiceExtras = buildAgentExtras(baseAgentContext(memory), ["justice"]);
    assert.match(justiceExtras, /<adjudication_context>/);
    assert.match(justiceExtras, /JUSTICE_PACKET/);
    assert.match(justiceExtras, /<game_lore_context>/);
    assert.doesNotMatch(justiceExtras, /<composition_context>/);
    assert.doesNotMatch(justiceExtras, /<active_hud_widgets>/);

    const emperorExtras = buildAgentExtras(baseAgentContext(memory), ["emperor"]);
    assert.match(emperorExtras, /<composition_context>/);
    assert.match(emperorExtras, /EMPEROR_PACKET/);
    assert.match(emperorExtras, /<game_lore_context>/);
    assert.doesNotMatch(emperorExtras, /<adjudication_context>/);
    assert.doesNotMatch(emperorExtras, /<active_hud_widgets>/);

    const chariotExtras = buildAgentExtras(baseAgentContext(memory), ["chariot"]);
    assert.match(chariotExtras, /<active_hud_widgets>/);
    assert.match(chariotExtras, /threat/);
    assert.doesNotMatch(chariotExtras, /<adjudication_context>/);
    assert.doesNotMatch(chariotExtras, /<composition_context>/);
    assert.doesNotMatch(chariotExtras, /<game_lore_context>/);

    const hermitExtras = buildAgentExtras(baseAgentContext(memory), ["hermit"]);
    assert.doesNotMatch(hermitExtras, /<adjudication_context>/);
    assert.doesNotMatch(hermitExtras, /<composition_context>/);
    assert.doesNotMatch(hermitExtras, /<active_hud_widgets>/);
    assert.doesNotMatch(hermitExtras, /<game_lore_context>/);
  });

  it("keeps Onyx-derived practices inside the owning Tarot agent prompts", () => {
    const justicePrompt = getDefaultAgentPrompt("justice");
    const emperorPrompt = getDefaultAgentPrompt("emperor");
    const hermitPrompt = getDefaultAgentPrompt("hermit");
    const chariotPrompt = getDefaultAgentPrompt("chariot");

    assert.match(justicePrompt, /Onyx action discipline/);
    assert.match(justicePrompt, /DC scale: 1-5 trivial, 6-10 easy, 11-15 moderate/);
    assert.doesNotMatch(justicePrompt, /widgetId/);

    assert.match(emperorPrompt, /Onyx composition discipline/);
    assert.match(emperorPrompt, /не подыгрывает удобству персонажа игрока/);
    assert.match(emperorPrompt, /НЕ добавляй \[widget:\]/);
    assert.match(emperorPrompt, /Язык — часть контракта/);
    assert.match(emperorPrompt, /language="English"/);
    assert.match(emperorPrompt, /choices\/readables должны быть на английском/);
    assert.match(emperorPrompt, /Time accuracy \/ time skip engine из Zetta Onyx v1\.55/);
    assert.match(emperorPrompt, /runtime Game state/);
    assert.match(emperorPrompt, /activity type/);
    assert.match(emperorPrompt, /Character force из Zetta Onyx v1\.55/);
    assert.match(emperorPrompt, /Offscreen world progression/);
    assert.match(emperorPrompt, /ZT_STATE adaptation/);
    assert.match(emperorPrompt, /Не выводи SillyTavern header/);
    assert.match(emperorPrompt, /Handshake \/ Freaky-Balanced adult routing из Zetta Onyx v1\.55/);
    assert.match(emperorPrompt, /fiction authorized at full force/);
    assert.match(emperorPrompt, /Character Force applies/);
    assert.match(emperorPrompt, /Adult register активен в каждой сцене/);

    assert.match(hermitPrompt, /Onyx prose discipline/);
    assert.match(hermitPrompt, /Zetta Onyx v1\.55/);
    assert.match(hermitPrompt, /Private BOLT v2 editor room/);
    assert.match(hermitPrompt, /Humanizer\/deslop pass/);
    assert.match(hermitPrompt, /banned vocabulary/);
    assert.match(hermitPrompt, /do_not_repeat_descriptions/);
    assert.match(hermitPrompt, /handshake\/Freaky-Balanced routing/);
    assert.match(hermitPrompt, /Preserve character force/);
    assert.match(hermitPrompt, /Sex\/intimacy still require established charge and slow burn/);
    assert.match(hermitPrompt, /bare standalone italic thought lines/);
    assert.match(hermitPrompt, /Remove donor ZT_STATE leakage/);
    assert.match(hermitPrompt, /dossier loops/);
    assert.match(hermitPrompt, /not \/ never \/ no longer \/ not quite \/ not yet/);
    assert.match(hermitPrompt, /That's not X\. That's Y\./);
    assert.match(hermitPrompt, /changed=false is legal only/);
    assert.match(hermitPrompt, /banned_vocabulary/);
    assert.match(hermitPrompt, /narration, dialogue, and interior alike/);
    assert.match(hermitPrompt, /Never add the donor SillyTavern bracket header/);
    assert.match(hermitPrompt, /Это НЕ сценарная роль/);
    assert.match(hermitPrompt, /speaker labels/);
    assert.doesNotMatch(hermitPrompt, /DC scale/);
    assert.doesNotMatch(hermitPrompt, /widgetId/);

    assert.match(chariotPrompt, /Onyx panel discipline/);
    assert.match(chariotPrompt, /только трекеры, которые ИЗМЕНИЛИСЬ/);
    assert.doesNotMatch(chariotPrompt, /DC scale/);
  });

  it("keeps the full default Tarot Game stack visible", () => {
    assert.deepEqual([...GAME_TAROT_DEFAULT_AGENT_IDS], ["justice", "emperor", "tower", "hermit", "chariot"]);
    for (const agentId of GAME_TAROT_DEFAULT_AGENT_IDS) {
      assert.equal(isAgentAvailableInChatMode("game", agentId), true, `${agentId} must be available in Game mode`);
    }
  });
});
