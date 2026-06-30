# Canon Vault And Hierophant Implementation Plan

**Intent:** Add useful canon-aware web research to Game Mode through Brave Search without letting raw web search leak into Tower, long prompts, or uncontrolled model behavior.
**Current Behavior:** Game setup and runtime rely on user lorebooks, selected character cards, reference character indexes, model memory, and existing `game_lore_context`. Knowledge agents exist for roleplay/VN lorebooks, but Game mode has no sourced external canon research owner.
**Expected Outcome:** During setup and selected runtime turns, a dedicated Canon Vault pipeline researches, stores, cites, and routes compact canon facts to the right Tarot owners. The player can see what was researched and why.
**Target-Perspective Output:** The player creates a game in a known universe and sees accurate, sourced world setup. During play, canon facts support adjudication and composition without the scene turning into a search report or lore dump.
**Truth Owner:** Server-owned Canon Vault tables and services. Lorebooks may receive user-facing distilled entries, but the authoritative sourced external facts live in Canon Vault.
**Contract Boundary:** Brave returns search/context data; Hierophant converts it into typed `CanonClaim`, `CanonEntity`, `CanonSource`, and `CanonPacket` records; Game agents receive only routed packets, never raw search results.
**Cutover:** Add Canon Assist as an opt-in setup/runtime subsystem. Keep existing lorebooks and `game_lore_context`, then route Canon Vault packets into that context. Delete or forbid any direct Brave calls from Tower/GM prompts.
**Displaced Path:** Ad hoc model memory, broad web snippets in prompts, and any future direct "GM can google" path. Those become diagnostics or manual notes, not canonical data.
**Value Density:** First slice is setup-time Canon Assist plus manual refresh. Runtime auto-search comes after the storage, routing, source UI, and setup playtests prove value.
**Acceptance Evidence:** Five universe setup playtests, two runtime mini-campaign playtests, source/citation logs, agent routing logs, no raw-web leakage into Tower, and no mutations against the user's live game.
**Evidence Lane:** Temp chats and scripted smoke harnesses under `tmp-userflow/canon-vault-hierophant/`; source snapshots in Canon Vault; SSE/debug events proving Hierophant, Justice, Emperor, Tower routing.
**Kill Criteria:** No direct Brave client outside `brave-search.service.ts`; no raw search result in GM/Tower prompts; no runtime search without trigger, budget, cache, and stored research run; no second canon store competing with Canon Vault.
**Architecture Slice:** Backend service, DB schema, shared types/schemas, prompt contracts, setup/runtime hooks, source UI, and temp-playtest harness.
**Plan Review Gate:** Requires PRE review before execution.

## References

- Brave Web Search API documentation: https://api-dashboard.search.brave.com/app/documentation/web-search/get-started
- Brave Search API docs, LLM/RAG-oriented context endpoint should be verified during implementation: https://api-dashboard.search.brave.com/documentation/services/llm-context
- Existing repo hooks: `packages/server/src/services/game/gm-prompts.ts`, `packages/server/src/routes/game.routes.ts`, `packages/server/src/routes/generate.routes.ts`, `packages/server/src/services/agents/agent-executor.ts`, `packages/server/src/services/lorebook/*`, `packages/shared/src/constants/agent-prompts.ts`

## Outcome Contract

Plan title: Canon Vault And Hierophant

Intent: Give Game Mode a controlled way to research external canon and use it during setup/runtime.

Current behavior: The model improvises canon from training data, user lorebooks, and character cards. Existing `knowledge-retrieval`/`knowledge-router` read lorebooks only and are not allowed in Game mode.

Expected outcome: Canon research is a server-owned, cited, cached, inspectable source of truth. Tarot agents consume small role-specific packets.

Target-perspective output: A user can start a Genshin, 40k, Cyberpunk, JJK, or Witcher game and see that setup knows key canon without dumping every wiki paragraph. During play, a canon-sensitive action gets fair adjudication and composition.

Truth owner: Canon Vault.

Contract boundary: Typed claims and packets, not web snippets.

Cutover: Setup-time Canon Assist first. Runtime research stays explicit/manual until playtests show trigger quality.

Displaced path: Raw model recall for canonical facts that are selected for research.

Acceptance evidence: The playtest matrix at the end of this plan.

Evidence lane: Temp chats, request logs, research runs, source records, prompt packet snapshots.

Kill criteria: Direct Brave calls from prompts/agents fail code review; Tower never receives raw search.

Non-goals: General web browsing UI, replacing user lorebooks, automatic copyright-heavy ingestion, making Game mode require internet, scraping full sites.

Risk if wrong: Slow turns, source spam, prompt injection from pages, canon overfitting, stale facts, or the model treating internet snippets as story directives.

## Architecture Slice

Files to create:

- `packages/shared/src/types/canon.ts`
- `packages/shared/src/schemas/canon.schema.ts`
- `packages/server/src/db/schema/canon.ts`
- `packages/server/src/services/canon/brave-search.service.ts`
- `packages/server/src/services/canon/canon-vault.storage.ts`
- `packages/server/src/services/canon/canon-research.service.ts`
- `packages/server/src/services/canon/canon-packet.service.ts`
- `packages/server/src/services/agents/tarot/hierophant-canon.ts`
- `packages/server/src/routes/game-canon.routes.ts`
- `packages/client/src/features/game/canon/*`
- `packages/server/src/services/game/__tests__/canon-*.test.ts`
- `tmp-userflow/canon-vault-hierophant/*` smoke harnesses

Files to modify:

- `packages/server/src/db/schema/index.ts`
- `packages/server/src/db/migrate.ts`
- `packages/server/src/db/file-backed-store.ts`
- `packages/shared/src/index.ts`
- `packages/shared/src/constants/agent-prompts.ts`
- `packages/shared/src/constants/chat-mode-capabilities.ts`
- `packages/shared/src/features/agents/agent-registry.generated.ts` via generator path
- `packages/server/src/routes/game.routes.ts`
- `packages/server/src/routes/generate.routes.ts`
- `packages/server/src/services/game/gm-prompts.ts`
- `packages/server/src/services/agents/agent-executor.ts`
- `packages/server/src/services/generation/game-gm-prompt-runtime.ts`
- Client game setup/settings surfaces and Game logs panel

Files to avoid:

- Do not add Brave access to Tower prompts.
- Do not add broad custom function tools available to arbitrary agents.
- Do not mutate user live chats in smoke tests.
- Do not store full copyrighted pages as durable content.

Source of truth: Canon Vault DB rows.

Read path:

1. Game setup/runtime asks Canon Packet service for a role-specific packet.
2. Packet service reads Canon Vault claims for chat/universe/entities/current scene.
3. Justice/Emperor receive `game_lore_context` and `canon_packet` subsets.
4. Tower receives only scene-visible canon notes and names/terms needed for prose.
5. Hermit receives no source dump, only style/term constraints if Tower already used them.

Write path:

1. User enables Canon Assist or runtime trigger fires.
2. Hierophant builds a research plan from setup/current turn.
3. Brave service performs bounded search/context calls with server-side key.
4. Canon research service normalizes claims, scores confidence, dedupes, stores sources.
5. Optional distilled lorebook entries are created only as derived projections, never truth.

Contract boundary:

```ts
type CanonSourceTier = "official" | "wiki" | "database" | "fan" | "forum" | "unknown";
type CanonClaimStatus = "active" | "conflicting" | "stale" | "rejected" | "user_override";
type CanonScope = "setup" | "runtime" | "character" | "location" | "faction" | "mechanic" | "item";

interface CanonClaim {
  id: string;
  chatId: string;
  universeKey: string;
  entityId: string | null;
  subject: string;
  predicate: string;
  value: string;
  scope: CanonScope[];
  confidence: number;
  status: CanonClaimStatus;
  sourceIds: string[];
  fetchedAt: string;
  staleAt: string | null;
}

interface CanonPacket {
  role: "justice" | "emperor" | "tower" | "setup" | "ui";
  claims: CanonClaim[];
  sourceRefs: Array<{ sourceId: string; title: string; url: string; tier: CanonSourceTier }>;
  budget: { maxClaims: number; maxChars: number };
}
```

Integration points:

- Setup: `buildSetupPrompt` receives a `canonSetupPacket`; apply-json persists `canonUniverseKey` and `canonMode` into chat metadata.
- Runtime: before Tarot action agents run, `generate.routes.ts` asks `canon-packet.service.ts` for route-specific packets and stores them in `agentContext.memory._tarotCanonContext`.
- Agents: add `hierophant` as hidden Game-allowed Tarot support agent. It is a research owner, not part of visible narrative chain.
- UI: Game setup gets Canon Assist controls; Game logs get Research Runs and Source Cards.

Migration/cutover:

1. Add tables with no behavior change.
2. Add UI settings with default disabled.
3. Add manual Canon Assist setup action.
4. Route setup packets.
5. Route runtime packets behind explicit trigger.
6. Enable auto-trigger only after playtests.

Displaced path:

- Existing lorebook and character-card context remain, but external canon claims come through Vault.
- Existing `knowledge-retrieval` and `knowledge-router` stay roleplay/VN; do not quietly enable them in Game as a shortcut.

Acceptance evidence gate:

- Implementation cannot be called ready until all five setup playtests and two runtime playtests pass with saved source/run evidence.

## Product Model

### Canon Modes

- `off`: no external research.
- `setup_only`: research during world creation and manual refresh.
- `assisted`: setup plus explicit runtime "research this" and safe trigger suggestions.
- `auto`: setup plus bounded runtime triggers. This is post-playtest only.

### Canon Strictness

- `strict`: official sources and high-quality wiki/database sources. Conflict blocks claim injection until reviewed.
- `soft`: sourced canon guides setup, Game may adapt with clear divergence.
- `inspired`: sources act as references, not binding canon.

### UI Surface

- Setup wizard: universe/franchise field, Canon Assist toggle, strictness, source preference, max research budget.
- Research preview: entities found, claims selected, sources, conflicts.
- Game logs: Hierophant runs, queries, source cards, packet recipients.
- Manual controls: refresh universe, refresh character, pin/reject claim, mark user override.

## Agent Ownership

### Hierophant

Owns:

- Research planning.
- Query construction.
- Source triage.
- Claim extraction.
- Conflict marking.
- Packet recommendations.

Does not own:

- Scene writing.
- Rolls or DCs.
- Turn composition.
- Widget deltas.
- User-authored lore overrides.

### Justice

Reads:

- Mechanics, power rules, limitations, faction rules, monster/ability constraints.

Uses:

- DC selection, auto-fail/auto-success, consequence plausibility.

### Emperor

Reads:

- Canon relationships, faction pressure, location facts, current-arc constraints.

Uses:

- Scenario composition and allowed state/choice/readable commands.

### Tower

Reads:

- Present-scene terms, names, location texture, voice/culture notes.

Uses:

- Prose rendering only.

### Chariot

Reads:

- Only when widgets are lore-backed, e.g. faction heat, wanted level, magic corruption.

### Hermit

Reads:

- Only surface terminology or naming constraints. It does not receive source context.

## Implementation Phases

### Phase 0: PRE Review

Allowed scope:

- Review this plan for ownership leaks, storage duplication, unsafe source ingestion, bad playtest evidence, and runtime latency risk.

Verification:

- PRE review notes are added to this plan or a sibling `REVIEW.md`.

Acceptance evidence:

- No blocker findings remain, or accepted blockers are explicitly listed.

Parallelizable:

- Yes, with a read-only reviewer.

### Phase 1: Schema And Contracts

Files:

- Shared canon types/schemas.
- Server canon DB schema, migration, file-backed store metadata.
- Unit tests for serialization, status, conflict, budget clamp.

Expected output:

- Canon Vault can store sources, entities, claims, research runs, and generated packets.

Verification:

- `pnpm --filter @marinara-engine/shared build`
- `pnpm --filter @marinara-engine/server test -- canon`
- `pnpm --filter @marinara-engine/server lint`

Acceptance evidence:

- Claims round-trip with source IDs, stale dates, confidence, and scope.

Parallelizable:

- Partly. Shared contracts first, storage tests after.

### Phase 2: Brave Service

Files:

- `brave-search.service.ts`
- Server config/env docs.
- Tests with mocked fetch.

Expected output:

- Server-only Brave client with API key from env, timeout, retry policy, per-chat budget, cache key, and safe result normalization.

Verification:

- Mocked unit tests for success, 429, bad key, timeout, duplicate URL, empty result.

Acceptance evidence:

- No Brave key reaches client, logs, prompts, or serialized agent payloads.

Parallelizable:

- Yes after Phase 1 contracts.

### Phase 3: Hierophant Research Pipeline

Files:

- `hierophant-canon.ts`
- `canon-research.service.ts`
- default Hierophant prompt.
- agent manifest/capability allowlist.

Expected output:

- Hierophant turns a setup/runtime research request into typed claims and conflicts.

Verification:

- Fixture tests using mocked Brave results for official/wiki/forum conflict cases.

Acceptance evidence:

- Research runs show queries, selected sources, rejected sources, claims, conflicts, and packet preview.

Parallelizable:

- No, depends on Phases 1-2.

### Phase 4: Setup-Time Canon Assist

Files:

- `game.routes.ts`
- `gm-prompts.ts`
- setup UI.
- route tests.

Expected output:

- Setup wizard can request Canon Assist. Setup prompt receives compact canon packet and must cite source-backed canon in `worldOverview`, `startingNpcs`, `storyArc`, map, widgets, and reference cast handling.

Verification:

- API route smoke with mocked Brave.
- Setup JSON validation with canon packet.

Acceptance evidence:

- Five universe setup playtests pass.

Parallelizable:

- UI and backend can split after contracts.

### Phase 5: Runtime Canon Packets

Files:

- `generate.routes.ts`
- `canon-packet.service.ts`
- agent executor context routing tests.
- GM/Tower prompt tests.

Expected output:

- Runtime packets route to Justice/Emperor/Tower with different budgets and no raw sources in Tower.

Verification:

- Tests prove Justice/Emperor receive full packet, Tower receives surface packet, Hermit receives no source dump.

Acceptance evidence:

- Two runtime mini-campaign playtests pass with logs.

Parallelizable:

- Mostly no.

### Phase 6: Source UI And Controls

Files:

- Client Game setup controls.
- Client Game logs/research panel.
- API routes for claim pin/reject/override.

Expected output:

- Player can inspect research runs, source cards, claims, conflicts, and overrides.

Verification:

- Playwright screenshots for setup and in-game research log.

Acceptance evidence:

- User can identify why a canon fact entered the game without reading backend logs.

Parallelizable:

- Yes after route contracts exist.

### Phase 7: Auto Trigger Tuning

Files:

- Trigger detector service.
- Runtime budget config.
- Tests and telemetry.

Expected output:

- Runtime research triggers only on useful uncertainty.

Trigger set:

- Explicit user request.
- Unknown canon term in current input.
- Selected reference character lacks a Canon Vault profile.
- Justice needs a canon rule for an uncertain action.
- Emperor wants to introduce a canon entity/location/item.
- Existing claim is stale or conflicting and relevant now.

Verification:

- Fixture tests for trigger/no-trigger.

Acceptance evidence:

- Runtime playtests show useful research, no search spam, no turn latency blowup.

Parallelizable:

- No, depends on observed playtests.

## Playtest Matrix

All playtests run in temporary chats under a dedicated harness. They must not mutate the user's live game.

### Setup Playtest 1: Genshin Impact

Goal:

- Verify faction/location/elemental canon and reference-character handling.

Setup prompt:

- "Create a Game Mode campaign in Inazuma with a wandering outsider, political pressure around the Shogunate, and future possible appearances by Raiden Shogun, Yae Miko, and Kujou Sara."

Acceptance:

- Correctly distinguishes Inazuma, Electro Archon, Shogunate, shrine/political factions.
- Reference characters are indexed as future/offscreen unless setup asks for presence.
- No first-scene crowd dump.

### Setup Playtest 2: Warhammer 40,000

Goal:

- Verify scale, faction brutality, and strictness mode.

Setup prompt:

- "Create a grimdark investigation game on an Imperial hive world with Adeptus Arbites pressure and xenos rumors."

Acceptance:

- Correct tone and faction basics.
- No modern-police normalization.
- Canon packet does not overstuff Tower prose.

### Setup Playtest 3: Cyberpunk 2077

Goal:

- Verify corporations, Night City locations, cyberware/social tone.

Setup prompt:

- "Create a street-level Night City game around a fixer job, debt, and corporate surveillance."

Acceptance:

- Uses Night City/corpo/fixer/cyberware facts accurately.
- Widgets can adapt to money/heat/rep without becoming generic fantasy.

### Setup Playtest 4: Jujutsu Kaisen

Goal:

- Verify power-system constraints.

Setup prompt:

- "Create a game about a novice sorcerer pulled into a cursed incident near a school."

Acceptance:

- Handles curses, sorcerers, cursed energy as constraints for Justice.
- Avoids dumping top-tier characters into opening scene.

### Setup Playtest 5: The Witcher

Goal:

- Verify monster contracts, political/world texture, grounded fantasy.

Setup prompt:

- "Create a monster-contract game in the Northern Kingdoms with a village dispute and hidden curse."

Acceptance:

- Monster/potion/signs/politics are plausible.
- Setup remains playable and not a wiki article.

### Runtime Playtest A: Genshin Impact, 10-12 Turns

Scenario:

- Player investigates a suspicious Electro barrier and tries a risky bypass.

Evidence:

- Hierophant retrieves/uses relevant canon only if needed.
- Justice receives power/element constraints.
- Emperor composes consequences from canon.
- Tower renders scene without source dump.
- Roll widgets still work.

Pass criteria:

- No raw URLs in narration.
- Source cards visible in research log.
- At least one canon-backed Justice decision.
- No agent ownership leak.

### Runtime Playtest B: Cyberpunk 2077 Or JJK, 10-12 Turns

Scenario:

- Cyberpunk: player negotiates with a fixer, then uses cyberware under corporate heat.
- JJK alternate: player confronts a curse with uncertain technique limits.

Evidence:

- Runtime trigger fires only on useful uncertainty.
- Cached claims are reused.
- Emperor does not introduce a researched canon character unless setup/current scene supports it.

Pass criteria:

- Search calls remain under configured budget.
- Latency is visible but bounded.
- Source claims improve play instead of derailing it.

## Telemetry And Debug Events

Emit:

- `canon_research_started`
- `canon_research_result`
- `canon_claims_stored`
- `canon_packet_built`
- `canon_packet_injected`
- `canon_research_skipped`

Include:

- chatId, runId, trigger, query count, source count, claim count, packet role, budget, cache hits.

Exclude:

- Brave API key.
- Full raw page text.
- Hidden model reasoning.

## Failure Modes

- Brave missing key: Canon Assist disabled with visible setup warning.
- Rate limited: use cache, mark stale, continue without runtime search.
- Conflicting sources: store conflicts, inject only stable claims unless user accepts.
- Prompt injection in source text: strip instructions, store claims only, never raw page instructions.
- Over-broad query: Hierophant asks narrower query or skips runtime research.
- Wrong canon: user can reject/pin override; rejected claim stops routing.

## Rollout

1. Hidden dev flag: schema, service, mocks.
2. Setup-only manual Canon Assist.
3. Five setup playtests.
4. Runtime explicit research.
5. Two runtime mini-campaign playtests.
6. Auto-trigger behind setting.
7. Default recommended mode becomes `setup_only`; `auto` stays opt-in.

## Definition Of Done

- Canon Vault owns sourced external facts.
- Brave key is server-only.
- Source UI proves why facts entered the game.
- Justice/Emperor/Tower receive role-appropriate packets.
- Five setup playtests and two runtime playtests pass.
- Existing lorebook behavior still works.
- Game remains playable with Brave disabled.
- No direct search path exists outside the Canon service.
