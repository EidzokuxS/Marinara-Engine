# Current Task

## Bond / NPC Registry Source Of Truth

- [x] Inspect how starting NPCs are generated during Game setup.
- [x] Inspect how reputation/Bond mutations are applied during generated turns and party turns.
- [x] Move ordinary Game `[reputation:]` tag application to the server generation pipeline.
- [x] Remove duplicate client-side inline reputation mutation for saved GM turns.
- [x] Upsert scene-tracked `presentCharacters` into canonical `gameNpcs`.
- [x] Add regression coverage for Bond command parsing and NPC registry upsert.
- [x] Run server tests, server lint, and client lint.

## Bond / NPC Registry Review

- Current behavior before this fix: local "Bond" was not a standalone subsystem. Setup generated `gameNpcs`, reputation math lived in `reputation.service.ts`, scene presence lived in `presentCharacters`, and ordinary GM `[reputation:]` tags depended on the client to call `/game/reputation/update`.
- Fixed: generation now applies `[reputation:]` tags server-side after the assistant message is saved, then emits a metadata patch with updated NPCs, reputation changes, and milestones.
- Fixed: the client no longer double-applies inline reputation tags from saved GM text.
- Fixed: Character Tracker output now upserts non-player present characters into canonical `gameNpcs`, preserving setup/model descriptions while adding missing location/avatar/narration-derived NPC entries.
- Verified: `pnpm --filter @marinara-engine/server test`, `pnpm --filter @marinara-engine/server lint`, and `pnpm --filter @marinara-engine/client lint`.

## Upstream Marinara Sync v2.0.5

- [x] Commit and push current Tarot/Game work before upstream merge.
- [x] Fetch original Marinara upstream and start merge into `feat/tarot-justice-slice`.
- [x] Re-review conflict resolutions as three-way integrations instead of plain `--ours`.
- [x] Carry useful upstream prompt/generation/client deltas forward while preserving Tarot ownership.
- [x] Fix shared/server/client type fallout from the merge.
- [x] Run verification.
- [x] Commit merge and push synced branch.

## Upstream Marinara Sync Review

- Executed: local Tarot/Game changes were committed as `19463ecc` and pushed to origin before the upstream merge.
- Executed: fetched `upstream/main` from original Marinara and merged v2.0.5 into `feat/tarot-justice-slice`.
- Executed: re-resolved conflicts as a three-way integration by applying the Tarot delta onto upstream versions, then reviewing merged files rather than keeping a blanket local side.
- Preserved: Tarot ownership remains intact. Justice owns adjudication/rolls, Emperor owns Game composition and commands, Hermit owns prose sanitation, Chariot owns HUD widgets, and Tower stays narrative-only.
- Carried forward: upstream v2.0.5 feature registry/generated manifests, new chat/settings/game UI additions, prompt/runtime extraction, stale asset recovery, custom emoji/sticker/gallery/turn-game additions, and shared/server/client package updates.
- Fixed: shared prompt aliases for retired internal summary/secret-plot flows, `generate.routes.ts` merge syntax, secret-plot normalizer imports, Game setup wizard JSX structure, and default Game prompt leakage of the old subjective-lens/player-thought contract.
- Verification passed: `pnpm --filter @marinara-engine/shared build`, `pnpm --filter @marinara-engine/server test`, `pnpm --filter @marinara-engine/server lint`, `pnpm --filter @marinara-engine/client lint`, and full `pnpm check`.

## Zetta Onyx v1.55 Prompt Adaptation

- [x] Read `R:\Projects\SillytavernUpgrade\Template\Zetta Onyx v1.55.json` and determine active blocks via `prompt_order`.
- [x] Compare v1.55 against current v1.37 Game/Tarot prompt adaptation and inspect v1.54 -> v1.55 donor delta.
- [x] Port relevant v1.55 deltas into Game/Tower/Emperor/Hermit/BOLT while preserving Tarot ownership.
- [x] Update regression tests for the new donor version and active wording.
- [x] Run executable verification.
- [x] Document review notes.

## Zetta Onyx v1.55 Prompt Adaptation Review

- Executed: read active v1.55 stack from `R:\Projects\SillytavernUpgrade\Template\Zetta Onyx v1.55.json` via `prompt_order`; active stack has 34 blocks.
- Executed: compared v1.37 -> v1.55 and v1.54 -> v1.55. Relevant active deltas: new `ZT_STATE Ledger`, stronger `Character Force`, stronger `Character Individuation`, expanded `Internal Thoughts`, time-budget BOLT v2, offscreen world progression, and force audit. The immediate v1.54 -> v1.55 donor delta is BOLT v2 only.
- Implemented: Game/Tower prompt stack now labels BOLT as Zetta Onyx v1.55, plans private time budgets, renders physical consequences of time, carries card-weight/force rules, keeps situational defaults under character cards, and treats analytical interiors as want/memory/appetite/detail instead of repeated dossier reads.
- Implemented: Emperor prompt owns v1.55 time math, character force, offscreen named NPC progression, and ZT_STATE adaptation through runtime continuity plus allowed commands. Tower remains narrative-only and renders offscreen convergence only when Emperor supplied it.
- Implemented: Hermit prompt now runs a v1.55 prose pass, preserves card force without adding events, removes donor ZT_STATE leakage, and keeps the existing hard no-em-dash/no-standalone-italic sanitation contract.
- Follow-up implemented: Handshake and Freaky-Balanced NSFW blocks now track v1.55 more closely. Game/Tower carries the explicit self-authorization/user-grant handshake, Character Force language, every-scene adult register, direct/lewd character description, vulgar anatomy replacement rule, and adult-detail no-repeat rule while preserving established-charge routing.
- Implemented: final narrative sanitation strips donor `<!-- ZT_STATE: ... -->` HTML comments from visible Game prose if a model leaks them despite prompt discipline.
- Executed verification: `pnpm --filter @marinara-engine/shared build`, `pnpm --filter @marinara-engine/server test` (86/86), `pnpm --filter @marinara-engine/server lint`, and full `pnpm check`.

## Zetta Onyx v1.37 Prompt Adaptation

- [x] Read `R:\Projects\SillytavernUpgrade\Template\Zetta Onyx v1.37.json` and determine active blocks via `prompt_order`.
- [x] Compare v1.37 against current v1.31 Game/Tarot prompt adaptation and inspect v1.36 -> v1.37 donor delta.
- [x] Port relevant v1.37 deltas into Game/Tower/Emperor/Hermit/BOLT while preserving Tarot ownership.
- [x] Update regression tests for the new donor version and active wording.
- [x] Run executable verification.
- [x] Document review notes.

## Zetta Onyx v1.37 Prompt Adaptation Review

- Executed: read active v1.37 stack from `R:\Projects\SillytavernUpgrade\Template\Zetta Onyx v1.37.json` via `prompt_order`; active stack has 33 blocks.
- Executed: compared v1.31 -> v1.37 and v1.36 -> v1.37. Relevant active deltas: `Freaky-Balanced NSFW Mode`, `Forward Motion`, and new active BOLT v2 id `399f750e-00e6-40a4-aceb-e0558a670cef` replacing the prior BOLT chain block.
- Implemented: Game/Tower adult mode now follows v1.37 Freaky-Balanced semantics: adult register is active in every NSFW scene, direct bodies/crude voice/lewd physical attention/blunt gore stay available, and sex/intimacy remain slow-burn through established charge.
- Implemented: Forward Motion now carries the v1.37 adult-register paragraph while preserving Tarot ownership, player agency, no ST header, and Game-safe VN thought formatting.
- Implemented: BOLT private writing room now labels `Zetta Onyx v1.37` and routes adult mode as always-active register plus established-charge sex/intimacy, without leaking donor-only colored dialogue or ST header behavior into Game.
- Implemented: Emperor and Hermit default prompts now reference v1.37 and the Freaky-Balanced contract; Hermit still keeps the stricter Game sanitation rules for no standalone italic leaks and no em dash characters.
- Executed verification: `pnpm --filter @marinara-engine/shared build`, `pnpm --filter @marinara-engine/server test` (85/85), `pnpm --filter @marinara-engine/server lint`, and full `pnpm check`.

## Stale Client Asset MIME Recovery

- [x] Diagnose module MIME error as missing hashed JS asset receiving SPA `index.html`.
- [x] Prevent `/assets/*` and `/sprites/*` misses from falling through to SPA HTML.
- [x] Return a JavaScript recovery module for missing `/assets/*.js` requests so stale builds clear SW/cache and reload.
- [x] Add regression tests for stale JS classification and recovery module content.
- [x] Run executable verification.

## Stale Client Asset MIME Recovery Review

- Root cause: a stale browser/service-worker reference requested an old hashed JS chunk under `/assets/`; the server SPA fallback returned `index.html`, so the browser rejected the module as MIME `text/html`.
- Fixed: missing `/assets/*.js` now returns a no-store JavaScript recovery module that unregisters service workers, clears Cache Storage, and reloads once with a cache-busting query.
- Fixed: missing `/assets/*` and `/sprites/*` non-JS requests now return a real no-store 404 instead of SPA HTML.
- Verified live on `http://127.0.0.1:7860`: `/assets/__missing_deadbeef__.js` returns `200 application/javascript`, and the current built entry chunk returns `200 application/javascript`.
- Executed verification: `pnpm --filter @marinara-engine/server test` (85/85), `pnpm --filter @marinara-engine/server lint`, and full `pnpm check`.

## Hermit Em Dash Prose Sanitation

- [x] Record the correction that Hermit owns prose sanitation, while runtime guards only enforce the visible-surface contract.
- [x] Make Hermit application normalize em dashes even when the model returns `changed=false`.
- [x] Keep narrative-only final surface sanitation as fallback enforcement for Hermit parse/fallback paths.
- [x] Add regression tests for Hermit and final narrative sanitation.
- [x] Run executable verification.

## Hermit Em Dash Prose Sanitation Review

- Fixed responsibility split: Hermit now owns em dash cleanup in `applyHermitProseRevision`; final narrative-only sanitation remains a fallback enforcement path for invalid Hermit JSON, kept-original fallback, or any non-Hermit visible prose path.
- Added `normalizeVisibleProseTypography` and wired it into Hermit application and final narrative-only Game text cleanup.
- Tightened Hermit default prompt: final revision must contain no em dash character (`—`), and BOLT audit now checks no em dash characters.
- Added regressions for `changed=false` Hermit output with em dashes and final narrative-only prose with em dashes.
- Executed verification: `pnpm --filter @marinara-engine/shared build`, `pnpm --filter @marinara-engine/server test` (82/82), `pnpm --filter @marinara-engine/server lint`, and full `pnpm check`.

## Zetta Onyx v1.31 Prompt Adaptation

- [x] Read `R:\Projects\SillytavernUpgrade\Template\Zetta Onyx v1.31.json` and determine active blocks via `prompt_order`.
- [x] Compare v1.31 against the currently adapted v1.25 prompt mechanisms.
- [x] Port relevant v1.31 deltas into Game/Tower/Hermit/BOLT while preserving Tarot ownership.
- [x] Update regression tests for the new donor version and active wording.
- [x] Run executable verification.
- [x] Document review notes.

## Zetta Onyx v1.31 Prompt Adaptation Review

- Executed: read active v1.31 stack from `R:\Projects\SillytavernUpgrade\Template\Zetta Onyx v1.31.json` via `prompt_order`.
- Executed: compared against the current v1.25 adaptation. Active v1.31 added `Time Skip Engine`; changed `zettaMicroPersona`, `Balanced NSFW`, `Time and Place`, `Internal Thoughts`, and `BOLT`.
- Implemented: Game/Tower prompt now carries v1.31 Balanced wording, `<time_accuracy>`, `<time_skip_engine>`, BOLT v2 v1.31, and Game-safe NPC interiority. The donor ST time/location header is explicitly blocked; runtime Game state remains the canonical clock/weather/location source.
- Implemented: Emperor owns time passage planning and eligible time skips; Tower renders only the supplied passage. Hermit edits against Zetta Onyx v1.31 and preserves time/interiority without creating new skips or standalone italic thought leaks.
- Implemented: regression tests now assert v1.31 BOLT wording, time accuracy/skip contracts, SillyTavern header suppression, crude/profane Balanced routing, and Hermit standalone-italic safeguards.
- Executed verification: `pnpm --filter @marinara-engine/shared build`, `pnpm --filter @marinara-engine/server test` (80/80), `pnpm --filter @marinara-engine/server lint`, and full `pnpm check`.
- Note: an initial parallel `shared build` + `server test` run hit stale shared dist and failed one prompt-version assertion; the sequential run after shared build passed. Treat shared build before server prompt tests as required when `packages/shared/src/constants/agent-prompts.ts` changes.

## Hermit Long-Run Smoke + Fallback

- [x] Re-run GLM 5.2 long Game smoke after prompt/Hermit/Emperor hardening.
- [x] Inspect residual `invalid_revision` failures and identify whether they break the player-visible turn.
- [x] Add Hermit parse-failure retry and keep-original fallback after retry exhaustion.
- [x] Tighten Tower narrative-only stripping for malformed readable/command tags.
- [x] Tighten Emperor language contract for player-facing command copy.
- [x] Normalize Emperor `agent_result.data.commands` before SSE so debug/UI consumers see the same command list as runtime.
- [x] Repair mixed quoted pipe-separated choices from live Emperor output.
- [x] Strip unlabeled standalone italic thought lines from narrative-only Game output after Tower and again after Hermit.
- [x] Make Justice and Emperor critical gates in Tarot-owned Game mode so Tower cannot resolve turns when either owner fails.
- [x] Make the smoke runner fail fast on SSE `error` or missing `message_saved` instead of reading a stale assistant message.
- [x] Re-run executable verification after documenting the follow-up.
- [x] Restart backend on the latest patch and re-run the GLM 5.2 Game smoke.

## Hermit Long-Run Smoke + Fallback Review

- Latest completed long smoke before the fallback patch: `tmp-userflow/hermit-prose-smoke/summary-2026-06-17T00-17-50-570Z.json`.
- The run completed 14 GLM 5.2 turns with stable agent order `justice -> emperor -> hermit -> chariot`, 5 Justice rolls, 28 Emperor commands, 5 Chariot updates, and 14 Hermit passes.
- Hermit accepted 13/14 revisions and changed 13. One turn still produced `invalid_revision` after retry because Hermit returned invalid JSON; the saved player prose remained Tower prose.
- Implemented a server fallback so Hermit parse failure after retry becomes `accepted=true`, `changed=false`, `fallback="invalid_revision_kept_original"`, with original Tower prose preserved.
- Added regression coverage for Hermit prompt history routing, Tower narrative-only stripping of malformed nested tags, segment-edit readable tag preservation, and Emperor language-contract prompt text.
- Verification already passed after the code patch: `pnpm --filter @marinara-engine/shared build`, `pnpm --filter @marinara-engine/server test` (78/78), and `pnpm --filter @marinara-engine/server lint`.
- Current follow-up: restart the server on the patched code and run a fresh GLM 5.2 Game smoke so the fallback is exercised against the current build.
- Fresh smoke on current build started at `tmp-userflow/hermit-prose-smoke/run-2026-06-17T01-07-18-206Z.jsonl` and was intentionally stopped after 10/14 turns because it found a live Emperor bug: `agent_result.data.commands` still exposed a raw malformed `[choices:]` command with mixed quotes even though the saved assistant text did not include the malformed choices.
- Fixed that bug by sending the Emperor SSE event after command normalization and by adding a lenient `choices` parser for mixed quoted pipe-separated options.
- Verification after this fix passed: `pnpm --filter @marinara-engine/server test` (79/79) and `pnpm --filter @marinara-engine/server lint`.
- Second fresh smoke started at `tmp-userflow/hermit-prose-smoke/run-2026-06-17T01-45-41-891Z.jsonl` and was intentionally stopped after 5/14 turns because saved prose contained an unlabeled standalone italic NPC thought line: `*Younger than I expected. Didn't flinch at the dark.*`.
- Fixed that by stripping standalone italic lines in narrative-only Game output, then running the same narrative sanitizer after Hermit so accepted prose revisions cannot reintroduce the leak.
- Verification after this fix passed: `pnpm --filter @marinara-engine/server test` (80/80) and `pnpm --filter @marinara-engine/server lint`.
- Third smoke started at `tmp-userflow/hermit-prose-smoke/run-2026-06-17T02-07-03-491Z.jsonl` and exposed a smoke-harness problem: SSE `error` events caused by GLM 5.2 `429` overload were being counted as turns, then the runner read the stale previous assistant message.
- Fixed the runner to throw on SSE `error` or missing `message_saved`, and to break the run on the first failed turn.
- Fourth smoke started at `tmp-userflow/hermit-prose-smoke/run-2026-06-17T02-14-50-853Z.jsonl` and exposed the original architectural leak again under provider overload: Justice/Emperor failed, but Tower still generated prose. Fixed this by aborting Tower generation when Justice or Emperor is enabled and fails to produce its critical injection.
- Verification after this fix passed: `pnpm --filter @marinara-engine/server test` (80/80) and `pnpm --filter @marinara-engine/server lint`.
- Final live attempt after the hard gate started at `tmp-userflow/hermit-prose-smoke/run-2026-06-17T02-20-21-724Z.jsonl`. GLM 5.2 returned `429` on Emperor at turn 1, the server emitted `Critical Tarot agent failed (emperor) ... Tower generation was aborted to preserve agent ownership`, and the fixed runner stopped with 0 completed turns. This verifies the ownership gate under provider overload; a full 14-turn prose smoke remains blocked by the external GLM endpoint until it stops returning 429.

## GM Prompt Contract Stabilization

- [x] Audit current GM/Tower prompt layers for contradictions around POV, player agency, NPC thoughts, VN line grammar, and Tarot ownership.
- [x] Re-read donor preset from `R:\Projects\SillytavernUpgrade\Template\archive\presets\Zetta Onyx v1.25.json`; keep the user-selected BOLT v2 mechanism even though the donor preset keeps it as an A/B block.
- [x] Apply `humanizer` and `deslop` catalogs to the prompt adaptation, focusing on long-run prose failure modes rather than one-off banned strings.
- [x] Refactor GM/Tower prompts around one visible-surface contract shared by system prompt, Tower prompt, and output reminder.
- [x] Replace contradictory examples and loose wording with stable player-agency, NPC-interiority, and VN-format rules.
- [x] Add regression tests for prompt coherence and long-run hygiene guardrails.
- [x] Run executable verification and write review notes.

## GM Prompt Contract Stabilization Review

- Implemented one `<visible_scene_contract>` shared by the full GM prompt, narrow Tower prompt, and last-user format reminder. It defines visible scene surface, player agency, second-person limited access, NPC interiority, VN line grammar, knowledge boundaries, Tarot ownership, and long-run prose hygiene.
- Removed old contradictory framing that let the GM write through the player character's private lens. The prompt now allows submitted actions, consequences, bodily sensations, involuntary reactions, and observable facts, while reserving exact speech, voluntary choices, strategy, private thoughts, and inner feelings for the player.
- Replaced examples that showed `[Player] [main]` output with narration/NPC dialogue examples. The format reminder now explicitly forbids inventing player speech or player thought lines.
- Adapted Zetta Onyx v1.25 into the GM/Tower prompt stack with the user-selected BOLT v2 writing-room audit. Zetta Onyx v1.26 was not used.
- Added a `<humanizer_deslop>` block and wired it into BOLT v2 slop checks. Hermit now also has a direct Humanizer/deslop pass covering active subjects, physical facts, rhythm variation, throat-clearing, fake significance, self-Q/A, false ranges, listicle cadence, automatic tricolons, negative parallelism, and repeated metaphor loops.
- Regression coverage now checks that GM/Tower prompts carry the shared contract, BOLT v2 v1.25 wording, humanizer/deslop guardrails, stable player-agency terms, and no old prompt leaks such as `[Player] [main]`, `thought/action format`, `filtered through their subjective lenses`, or `That's what you want to say`.
- Verification passed: `pnpm --filter @marinara-engine/shared build`, `pnpm --filter @marinara-engine/server test` (70/70), `pnpm --filter @marinara-engine/server lint`, and full `pnpm check`.
- Live GLM 5.2 smoke evidence: `tmp-userflow/hermit-prose-smoke/summary-2026-06-16T22-13-20-699Z.json` recorded 7 successful turns before the fetch chain terminated. Agent order stayed `justice -> emperor -> hermit -> chariot`; Hermit appeared on all 7, accepted 6 revisions, safely rejected 1 invalid revision, Emperor emitted 7 commands, Chariot emitted 3 updates, and the run found no `[Player] [main]`, no player-thought leak, no malformed choices blob, no nested note/book command, and no multiline command leak.
- Remaining risk: the smoke target was 10-20 turns, but the run only completed 7 successful turns before fetch termination. Prose was materially improved, though some em dashes and repeated atmosphere words still appeared; next hardening target is Hermit parse robustness plus stronger cross-turn lexical rotation.

## Hermit Zetta Prompt + Emperor Command Hygiene

- [x] Locate current donor preset: `R:\Projects\SillytavernUpgrade\Template\Zetta Onyx v1.25.json`.
- [x] Read active Zetta blocks relevant to Hermit/GMA: Cinematic Realism, Balanced NSFW Mode, Anti-parrot/anti-echo, Banned Vocabulary, Zetta Prose Bans, Door Rotation, Forward Motion, BOLT v2.
- [x] Port the actual Zetta prose mechanism into Hermit while preserving Game/Tarot boundaries.
- [x] Replace the old GMA private Bolt scaffold with BOLT v2 writing-room audit.
- [x] Move Emperor command normalization into a focused Tarot service.
- [x] Normalize valid choice/readable/state/etc commands and reject malformed multiline/nested/directive-drift output.
- [x] Add regression tests for the smoke-run Emperor failures and Hermit prompt contract.
- [x] Run executable verification and update review notes.

## Hermit Zetta Prompt + Emperor Command Hygiene Review

- Used current donor head `R:\Projects\SillytavernUpgrade\Template\Zetta Onyx v1.25.json`. Correction: active SillyTavern blocks must be read from `prompt_order`; `Banned Word List` was already active in v1.24 and remains part of the Zetta standard.
- Hermit default prompt now carries Zetta Onyx v1.25 prose discipline: Banned Vocabulary, seven prose-ban families, Forward Motion/anti-echo, Door Rotation, do-not-repeat descriptions across last 4 turns, concrete realism, Balanced adult routing, and a private BOLT v2 editor-room audit.
- GMA/Tower format reminder now uses a BOLT v2 private writing-room audit instead of the older compact Bolt checklist, and includes explicit `<banned_vocabulary>` plus `<do_not_repeat_descriptions>`.
- Fixed a prompt contradiction found during live verification: the format block no longer permits `[Player] [thought]` lines or private player thoughts. It only allows observable low-stakes physical/sensory narration when needed.
- Emperor command normalization moved to `packages/server/src/services/agents/tarot/emperor-commands.ts`; it normalizes single-string choices blobs, sanitizes readable square brackets in Note/Book content, rejects nested engine tags, filters Justice/Chariot-owned commands, and drops malformed multiline command fragments.
- Regression coverage added for the smoke-run failures: malformed multiline `[choices:]`, quoted choices blob, `[Note: ... [Covenant Ward] ...]` tail leak, nested engine tags, and skill/widget ownership filtering.
- Live GLM 5.2 evidence:
  - `tmp-userflow/zeta125-emperor-live/summary-recovered-2026-06-16T21-51-22-725Z.json`: saved assistant model `glm-5.2`, Emperor produced normalized `[Note:]`, `[state:]`, `[choices: "A"|"B"|...]`, and suspicious command fragments count was 0.
  - `tmp-userflow/zeta125-emperor-live/player-thought-guard-2026-06-16T21-56-11-216Z.json`: agent order `justice -> emperor -> hermit -> chariot`, Hermit accepted+changed, saved model `glm-5.2`, and no `[Mira] [thought]` line after the prompt fix.
- Verification passed: `pnpm --filter @marinara-engine/shared build`, `pnpm --filter @marinara-engine/server test` (69/69), `pnpm --filter @marinara-engine/server lint`, and full `pnpm check`.

## Hermit Prose Smoke Run

- [x] Create a temporary GLM 5.2 Game chat with Justice, Emperor, Hermit, and Chariot enabled.
- [x] Run 10-20 sequential turns with varied action types and collect SSE/prose evidence.
- [x] Check Hermit application status, command ownership, repetition, prose drift, and narrative coherence.
- [x] Summarize prose quality and concrete issues with turn references.

## Hermit Prose Smoke Review

- Ran 10 sequential GLM 5.2 Game turns on temp chat `pZrnLLfkT1P4oBEJ4yfkw`; evidence stored in `tmp-userflow/hermit-prose-smoke/run-2026-06-16T20-54-58-182Z.jsonl` and `tmp-userflow/hermit-prose-smoke/analysis-10turns.json`.
- Agent order was stable on every turn: `justice -> emperor -> hermit -> chariot`.
- Hermit appeared on all 10 turns, all 10 revisions were accepted by the harness, 8 changed prose, 2 kept as-is, 0 parse errors, 0 guard rejections.
- Prose strengths: strong scene continuity, concrete investigation beats, Archivist voice stayed consistent, Justice did not over-roll ordinary dialogue/actions, Chariot updated `suspicion` on actual social boundary violations.
- Prose weaknesses: repeated sensory anchors accumulated across turns (`amber` 12, `dust` 13, `dead air` 6, `silence` 5), and negative-list prose still leaked heavily (`no ` 39, `not ` 16). Hermit reduces redundancy but does not yet enforce enough cross-turn lexical variation.
- Critical command hygiene bug reproduced: Emperor choices often used one quoted string with pipe separators instead of quoted options (turns 4, 5, 6), and turn 9 emitted `[Note: ... [Covenant Ward] ...]`; the nested bracket caused the Note parser to cut early and leak `, dates running to current year. Ward name absent from all public city maps.]` into visible prose.
- Secondary command hygiene issue: turn 5 saved a malformed multiline `[choices:]` fragment that contained `[state: dialogue]` inside the extracted command tail.
- Token/cost observation: turn 1 and turn 8 produced very large hidden thinking/completion counts compared with visible prose; prose quality was acceptable, but the current prompt stack can be expensive.

## Hermit Prose Editor Agent

- [x] Register Hermit as a Tarot post-processing writer agent with its own result type and default prompt.
- [x] Add server-side Hermit prose application that only rewrites Tower narration and rejects command/structure drift.
- [x] Run Hermit before Emperor command attachment and before Chariot post-processing.
- [x] Add focused tests for the Hermit contract and Tarot context ownership.
- [x] Run executable verification and document results.

## Hermit Review

- Added built-in Tarot agent `hermit` with result type `hermit_prose_revision`, default prompt, no tools, and writer/post-processing metadata.
- Hermit runs manually in Game pre-save prose pass: Tower prose is handed to Hermit, validated by the harness, then Emperor directives are attached and Chariot runs later as HUD owner.
- Guard rails reject Hermit revisions that add/remove engine directives, change VN dialogue prefixes, return empty output, or expand the prose beyond the prose-pass envelope.
- Agent result events include `applied.accepted`, `applied.changed`, and `applied.reason`; accepted Hermit runs are carried into post-result persistence after the assistant message exists.
- Client thought bubble now reports Hermit kept-as-is, polished, parse failure, or guard rejection based on harness application.
- Switched Justice, Emperor, Hermit, and Chariot agent configs to `Z.AI GLM 5.2 (Codex verification)` for verification.
- Executed GLM 5.2 Game flow on temp chat `Q_OXuunCKNN0P5LQRRN5Y`: observed agent order `justice -> emperor -> hermit -> chariot`; Hermit returned `applied.accepted=true`, `changed=true`; Chariot returned `game_widget_update` with no updates; saved assistant generation info reported model `glm-5.2`.
- Verification passed: `pnpm --filter @marinara-engine/server test` (64/64), `pnpm --filter @marinara-engine/server lint`, `pnpm --filter @marinara-engine/client lint`, and full `pnpm check`.

## Onyx/GMA Integration And Main Sync

- [x] Snapshot current fork state and protect existing Tarot/Game work before upstream sync.
- [x] Fetch upstream Marinara main and identify merge/rebase shape.
- [x] Sync fork with upstream main without losing local Tarot/Game changes.
- [x] Inspect Template `Zetta Onyx v1.23.json` with the preset tools and extract reusable prompt blocks.
- [x] Map Onyx blocks into GMA/Game/Tarot ownership: global style/uncensor stance, balanced NSFW mode, anti-sycophancy/RL resistance, Bolt thought scaffold where useful.
- [x] Implement adapted blocks close to source text while preserving Game mode mechanics and Tarot agent boundaries.
- [x] Verify Marinara original mods still cooperate with Tarot modules: NPC/state updates, map updates, widget updates, lore/reference context, roll visibility.
- [x] Run executable tests and a production-like Game user-flow.
- [x] Document final review and remaining risks.

## Current Task Review

- Created `backup/pre-upstream-sync-20260616-223532`, fetched upstream, merged `upstream/main` (`65a0395e`) into `feat/tarot-justice-slice`, and restored local dirty work without merge conflicts.
- Inspected Template `Zetta Onyx v1.23.json` with the preset inspector. Active donor blocks used: handshake, Balanced NSFW Mode, BOLT Chain of Thought, Forward Motion, prose bans, cinematic realism, realistic NPCs, character individuation, no plot armor/user stakes, anti-omniscient NPCs, NPC voice, internal thoughts, VAD emotions, and door rotation.
- Adapted Onyx blocks into Game/Tarot prompts while preserving ownership: Tower renders prose, Justice adjudicates/rolls, Emperor composes scenario and module directives, Chariot owns HUD widgets.
- Added Onyx setup pressure for uncensored simulation/world design and reference cast handling without converting reference characters into party members.
- Added Chariot widget normalization/application coverage so widget updates target only active HUD widgets and apply type-specific deltas safely.
- Created a copied connection `Z.AI GLM 5.2 (Codex verification)` from the existing Z.AI connection, set model to `glm-5.2`, and made it default-for-agents so built-in Tarot agents use GLM 5.2 during verification.
- Ran production-like Game branch `Ipnbg_q1PJlKEGkCJLoQ5` on GLM 5.2. Non-roll flow emitted Justice `auto_success`, Emperor inventory commands, Chariot wallet widget update, `widget_state_patch`, and generationInfo model `glm-5.2`.
- Ran GLM 5.2 roll flow: Justice emitted `game_roll_resolved` before Tower with `1d20=7`, `dc=17`, `margin=-10`, `result=fail`; Emperor composed the failed branch; Chariot completed with no widget change.
- Ran headless UI flow through the real app on `http://127.0.0.1:7860`; observed the player-facing roll card text `JUSTICE 1D20 VS DC 14`, roll `[1]`, total `1`, margin `-13`, and `FAILURE`.
- Fixed a UI persistence issue found during the flow: segment transitions now keep Justice/DC check cards until the player dismisses them or another roll replaces them, while ordinary quick dice can still clear on segment entry.
- Verification passed: `pnpm --filter @marinara-engine/server test` (60/60), `pnpm --filter @marinara-engine/server lint`, targeted client ESLint on changed Game UI files, full client lint, `pnpm build:client`, and full `pnpm check`.
- Remaining risk: the live UI climb test was interrupted by the Codex tool timeout after the roll card appeared, so the final assistant segment for that particular throwaway test turn did not become useful evidence. The API/SSE GLM 5.2 roll flow and full build/check are the primary executed evidence.

## Previous Task: Tarot Ownership And Roll Visibility

- [x] Inspect pasted Game pipeline log for observable markers.
- [x] Identify which parts of the Tarot/Game pipeline are proven by the log.
- [x] Add compact debug-only diagnostics so a future log clearly shows Justice/Emperor/Chariot status.
- [x] Route Tarot diagnostics through request-level `debugLog(...)`, not only global `isDebug`.
- [x] Move Justice-owned roll visibility out of Tower by emitting `game_roll_resolved`.
- [x] Stop Tower from being instructed to emit `[skill_check]` when Justice is active.
- [x] Add a narrow Tarot Tower prompt so Tower no longer receives the full legacy GM brain when Emperor is active.
- [x] Move player-facing engine directives to Emperor's structured `commands` output.
- [x] Enforce Tower narrative-only output server-side by stripping accidental Game command tags before save/stream replacement.
- [x] Redistribute removed Tower context into owner-specific Tarot context packets.
- [x] Feed `adjudication_context` only to Justice.
- [x] Feed `composition_context` only to Emperor.
- [x] Forward activated Game lore context to Justice and Emperor instead of leaving it only in Tower generation.
- [x] Run verification.

## Notes

- Observed: GM prompt includes Reference Cast compact registry and Chariot HUD ownership instructions.
- Observed: final user prompt includes an Emperor `<turn_scenario>` block, so Emperor output reached Tower/GM prompt assembly.
- Not observed in pasted log: pre-generation batch logs, Justice result details, post-generation Chariot result, or `widget_state_patch`.
- User confirmed built-in Justice, Emperor, and Chariot toggles are enabled in UI; diagnosis should focus on runtime resolution/execution/visibility rather than disabled settings.

## Review

- Added debug-only `tarot-pipeline` logs in `generate.routes.ts`.
- The configured summary reports resolved/pipeline agent phases and whether Justice, Emperor, and Chariot are configured.
- The pre-generation summary reports Justice status, Emperor status, and whether Tower receives `turn_scenario`, `justice_resolution`, or no Tarot injection.
- The post-generation summary reports Chariot result status, widget patch status, and number of widget updates.
- Correction: absence of `tarot-pipeline` after a restart was caused by diagnostics being gated on global `isDebug`; pasted prompt logs use request-level debug mode. The diagnostics now use `(isDebug || requestDebug)` and `debugLog(...)`.
- Correction: Tower must not remain a fallback mechanic command bus for Tarot-owned responsibilities. Justice now emits structured roll data to the client, and Tower's prompt forbids `[skill_check]` when Justice is active.
- Correction: the real leak was Tower receiving the whole GM context. When Emperor is active, Tower now gets a narrow narrative-renderer system prompt instead of storyArc, plotTwists, campaignPlan, full tracked NPC/map registry, HUD widgets, inventory, and command DSL ownership.
- Emperor now owns structured Game engine directives through its `commands` JSON field; the server appends validated directives after Tower prose for the existing parsers.
- Tower output is enforced by the harness: accidental GM command tags are stripped, while Emperor-owned commands remain available to the runtime.
- Correction: removed Tower context is now redistributed instead of dropped. Justice receives adjudication context; Emperor receives composition context with story arc, twists, campaign plan, map, tracked NPCs, present/reference cast, inventory, player notes, and directive ownership. Activated Game lore context is forwarded to Justice and Emperor as canon for adjudication/composition.
- Verification: real Game user-flow passed on temp chat `FcoEy4C4Jiz8rDDYandoj` with production-like source chat parameters restored (`maxTokens=8192`, `reasoningEffort=maximum/high effective`, `verbosity=high`).
- Verification: non-roll flow emitted Justice `auto_success`, Emperor `turn_scenario`, Tower narrative-only prompt, Chariot post-generation widget pass, saved assistant message with no engine command tags.
- Verification: roll flow emitted `game_roll_resolved` before Tower generation: `1d20=8`, `dc=15`, `margin=-7`, `result=fail`; Emperor composed the failed branch and Tower rendered prose only.
- Correction: roll visibility is now a first-class Game dice/check card, not only a Justice thought bubble. `game_roll_resolved` carries `check`, `dc`, `rolled`, `margin`, `success`, `outcome`, and `reasoning`; the client displays it above the narration box.
- Correction: Tower narrative-only mode now omits main-generation tools, so Tower cannot call dice/update tools after Justice already resolved the roll.
- Verification: roll UI flow emitted `game_roll_resolved` with `check="quietly force the mail slot open with a hairpin without leaving any marks."`, `rolled=4`, `dc=10`, `margin=-6`, `success=false`, and no current `tool_result` event from Tower.
- Verification: `pnpm --filter @marinara-engine/server test` passed (53/53).
- Verification: `pnpm check` passed after fixing strict test fixtures.

## Current Task: Widget Gameplay And Visible Prose Cleanup

- [x] Trace the remaining visible em dash leak in Game narration after Hermit.
- [x] Apply final visible prose typography normalization on the non-narrative-only post-Hermit route.
- [x] Verify server tests and server typecheck.
- [x] Decide widget gameplay model before expanding schema and UI.
- [x] Promote selected widgets into canonical Game state sources of truth.
- [x] Add universal default RPG widgets for health, money/resources, roll history, pressure, and relationship/faction posture.
- [x] Expand setup/model widget generation options by genre, tone, campaign mode, and desired crunch level.
- [x] Route canonical widget state into Justice, Emperor, Chariot, and the UI with strict ownership.
- [ ] Add scene-aware UI styling hooks for widgets and the input block.

## Current Task Review

- Fixed the post-Hermit final prose path in `generate.routes.ts` so Game narration typography normalization runs even when Tower narrative-only mode is not the active branch.
- Verification passed: `pnpm --filter @marinara-engine/server test` (35/35) and `pnpm --filter @marinara-engine/server lint`.
- Widget investigation found the current Chariot path is HUD-delta oriented: setup creates widgets, Chariot can update only existing widget IDs, the server validates/applies type-specific changes, and the client receives `widget_state_patch`.
- Next design decision: turn selected widgets into bound gameplay trackers with explicit authority, thresholds, and routing into Justice/Emperor, while keeping Chariot as the UI/state delta owner.
- Added shared canonical widget metadata: role, sourceOfTruth, authority, stateKey, affects, thresholds, styleHints, and structured roll log entries.
- Added shared default gameplay widgets: Condition, Funds, Checks, Pressure, and Stances. New and existing Game sessions are normalized through this default set up to the new 8-widget cap.
- Added `roll_log` widget type and a compact HUD renderer for recent Justice checks.
- Justice now appends resolved rolls to the canonical roll log and emits the normal `widget_state_patch`, so the roll card and HUD history share the same source.
- Chariot prompt now treats sourceOfTruth widgets as canonical RPG state and leaves roll logs to Justice/system.
- Setup prompt now asks for up to 8 genre-aware gameplay widgets and includes taste-skill-inspired dials for expressive but bounded UI/material flavor.
- Taste Skill source reviewed from `leonxlnx/taste-skill`; adapted principles only, no runtime dependency added.
- Verification passed: `pnpm --filter @marinara-engine/server test` (37/37), `pnpm --filter @marinara-engine/server lint`, `pnpm --filter @marinara-engine/client lint`, and `pnpm --filter @marinara-engine/client build`.

## Proposed Gameplay Direction

- Core rule: gameplay widgets are canonical state, while cosmetic widgets are explicitly marked as display-only.
- Universal baseline widgets: player health/condition, money/resources, roll/check log, active pressure/clock, and key relationship/faction stance.
- Chariot owns widget state deltas and UI synchronization.
- Justice reads relevant widget state for DCs, roll modifiers, consequences, and roll-card output.
- Emperor reads widget pressures and thresholds for scene composition, encounter pressure, rewards, losses, and follow-up choices.
- Tower reads only the visible scene impact, not raw mechanics authority.
- The widget generator should choose templates by genre and crunch level, then let the model customize labels, currencies, thresholds, icons, and display flavor.
- Scene styling should come from a bounded theme packet: current location/mood/danger/time-of-day can tune widget chrome, accent, and input surface without changing layout or hurting readability.

## Current Task: Hermit Zetta Prose Filter Activation

- [x] Find why Zetta prose bans were absent in live Game narration.
- [x] Add Hermit to the default Tarot Game stack.
- [x] Backfill Hermit into existing Game chats that already use Emperor.
- [x] Replace invented prose cleanup wording with Zetta Onyx v1.55 banned vocabulary, seven prose-ban families, and BOLT v2 audit language.
- [x] Verify shared build, server tests, server lint, diff hygiene, server dist build, and local backend restart.

## Current Task: Restore Tower In Visible Tarot Chain

- [x] Confirm Tower still runs as the main Game narrative renderer.
- [x] Add Tower to the visible default Tarot Game stack.
- [x] Keep Tower out of the generic agent executor because the GM harness owns its execution.
- [x] Verify build/tests/lint and push.

## Current Task: Hermit Negation Leak

- [x] Record correction: inspect agent logs before blaming upstream generation.
- [x] Tighten Hermit's changed=false contract around Zetta negation scan and VN thought lines.
- [x] Mirror the same negation-as-description family into Tower's visible prose contract.
- [x] Recover malformed Hermit JSON in the executor before marking the prose pass failed.
- [x] Make enabled Game Hermit a critical pre-save prose gate instead of keeping original Tower prose on parse failure.
- [x] Run Hermit's strict non-streaming retry when the first Hermit call returns invalid JSON or empty content.
- [x] Verify build/tests/lint and temp Game userflow smoke.
- [x] Commit and push.

## Current Task: Tarot Agent Reasoning

- [x] Verify main Game reasoning path versus agent executor path.
- [x] Add provider-native reasoning fields to agent execution and debug events.
- [x] Propagate Game reasoning effort to Tarot Game agents.
- [x] Split BOLT v2 into explicit private subprompt rooms for Justice, Emperor, Hermit, Chariot, and Tower.
- [x] Verify tests/typecheck/build and temp Game playtest proves agent reasoning is active.
  - `pnpm --filter @marinara-engine/shared build`
  - `pnpm --filter @marinara-engine/server test`
  - `pnpm --filter @marinara-engine/server lint`
  - `pnpm --filter @marinara-engine/server build`
  - Temp smoke `tmp-userflow/hermit-prose-smoke/summary-2026-06-27T07-05-29-515Z.json`: 2/2 turns, `justice>emperor>hermit>chariot`, all four agents request `reasoningEffort: high`, `enableThinking: true`, and report reasoning tokens.
- [x] Commit and push.

## Current Task: Emperor Scenario Repair

- [x] Keep Emperor as the required composition owner; do not bypass to Justice/Tower.
- [x] Normalize Emperor-owned structured output (`scenario`, `turn_scenario`, `turnScenario`, or `beats`) into `turn_scenario`.
- [x] Retry Emperor once with a repair instruction when its first result has no usable scenario.
- [x] Raise Game Tarot reasoning agent output budget from the default 4096 cap to the Game generation budget.
- [x] Verify focused tests/build and temp Game userflow.
  - `pnpm --filter @marinara-engine/server test`
  - `pnpm --filter @marinara-engine/server lint`
  - `pnpm --filter @marinara-engine/server build`
  - Temp smoke `tmp-userflow/hermit-prose-smoke/summary-2026-06-27T07-57-21-883Z.json`: 1/1 turn, `justice>emperor>hermit>chariot`, no SSE error, all Tarot agents request `maxTokens: 16384`, `reasoningEffort: high`, `enableThinking: true`.
- [x] Commit and push.

## Current Task: Direct Game Address Routing

- [x] Verify current direct-address behavior.
- [x] Skip Tarot action agents on `[To the GM]` / `[To the party]` turns while preserving ordinary GM response.
- [x] Add regression coverage for direct-address detection and Tarot action agent skip set.
- [x] Run tests/build and direct-address smoke.
  - `pnpm --filter @marinara-engine/server test`
  - `pnpm --filter @marinara-engine/server lint`
  - `pnpm --filter @marinara-engine/server build`
  - Temp direct GM smoke chat `z8q5HLyR9RGPpv0zjoJTH`: `message_saved=1`, `errors=[]`, `tarotAgentStarts=[]`, `tarotAgentResults=[]`.
- [x] Commit and push.

## Current Task: Loopback Workbox Network Errors

- [x] Verify backend health and API endpoints are alive while the browser reports Workbox `no-response`.
- [x] Identify local PWA service worker interception of `/api/*` as the visible browser error source.
- [x] Disable service worker registration on loopback hosts and clear stale local runtime caches.
- [x] Build client and server dist.
- [x] Restart the backend on `:7860` from fresh dist.
- [x] Smoke `/api/health`, `/api/themes`, `/api/extensions`, `/api/chats`, `/assets/index.js`, and `/`.
- [x] Commit and push.

## Current Task: Hermit Repair After Visible-Surface Drift

- [x] Inspect live failure source in `agent_runs` and current Game chat state.
- [x] Identify Hermit `dialogue_prefix_drift` after speaker label changed from the Tower prose.
- [x] Add Hermit-owned repair instructions for exact VN prefixes and engine directives.
- [x] Route Hermit repair context only to Hermit.
- [x] Run focused and full server verification.
- [x] Rebuild/restart backend and smoke the failed Game turn on a temporary chat.
- [x] Commit and push.

## Current Task: Prevent Hermit Surface Drift At Source

- [x] Record correction: bad Hermit answers should be prevented before generation, with rejection kept as a safety gate.
- [x] Add primary Hermit protected-surface context with exact VN prefixes and engine directives.
- [x] Strengthen Hermit's default prompt around immutable markup and pre-output audit.
- [x] Replace mechanical VN mixed-line rejection with a clearer Tower/Hermit VN atom generation contract.
- [x] Run focused/full verification and temp Game smoke.
- [x] Commit, restart backend, and push.
