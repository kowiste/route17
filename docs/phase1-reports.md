# Phase 1 — what each agent delivered (for the screens agent G and the lead)

## B · Round rules (`src/features/round/{domain,app}`)

- `new RoundService({ catalog, deck, records, random? })`. `state(): RoundState | null`; async `start(mode)`, `confirm()`, `stop()`; sync `select(option)`, `deselect()`, `useLifeline(ELifeline)`. Every method returns a new `RoundState`.
- `RoundState`: `setID`, `mode`, `status`, `rung` (1–17), `comunidadID`, `stop` (map index 0–16), `reached` (right answers 0–17); `points` (current, or banked once over), `safePoints`, `nextPoints`; `question` (`{questionID, topic, type, difficulty, text, options: {index, letter, text, removed}[]}`, answer hidden), `selected`; `lifelines` (`Record<ELifeline, {used, available}>`), `audience` (`{percentages}`), `friend` (`{option, confidence, certainty, message}`); `lastAnswer` and `answers` (each with `rung`, `comunidadID`, `chosen`, `answer`, `correct`, `explanation`); `nationality`, `best`, `newRecord`.
- The round advances at once on `confirm()`; the screens keep showing `lastAnswer` while she travels.
- The record counts right answers (0–17): the map's `best` prop is `stopOf(best)`.
- 50:50 on a true/false question is refused and stays unused.
- `start()` replaces an unfinished round without finishing it in the deck (the deck's unfinished-round rule covers it).
- An in-memory `IRoundRecords` fake is in `roundService.test.ts` (G implements the real one in `round/infra`).
- `ELifeline` values: `fiftyFifty`, `audience`, `friend` (map C's `LifelineBar` kinds to these).

## A · Catalog and deck (`src/features/questions`, `src/features/progress`)

- Wiring: `new QuestionCatalog(new GlobQuestionSetSource())`; `new ProgressService({ catalog, repository: new ProgressRepository(browserStore()), random: newRandom() })`.
- The loader globs `/questions/*/*.json` lazily (fetched on first use, kept; a failed load is retried next call). Any broken set makes the catalog fail with `AppError` corruptData naming the file (the file test guards this before commit).
- `sets()`: official sets newest first, then the game set.
- `roundsPlayed` counts finished rounds; the missed-question clock counts every deal.
- `finish()` is strict: an undealt or repeated question → invalidInput; no round going → invalidState; dealt questions left out count as unreached.
- Storage key `progress:<setID>`, format version 1; corrupt / other version / other set → fresh + warning.
- Open (lead): no `EErrorCode` for a question file that fails to download (offline); the loader rethrows the raw error.

## E · Our questions, tareas 3–5 (`questions/game/t3–t5`)

- t3 40 (30 choice / 10 V-F), t4 50 (37 / 13), t5 70 (52 / 18); difficulty about 40/40/20; right answers balanced across A/B/C.
- Left out on purpose: capitals of Castilla y León and Castilla-La Mancha (their statutes name none), minimum rental length, driving-licence age, speed limits, parental-leave length, number of national parks, population rankings, current sports results.
- For the fact-check (H): t5 touches tarea 2 twice (compulsory school ages, the aconfesional state); D may cover the same facts. A few explanations mention a fact another question asks (Lanzarote, Covadonga, Gaudí 1926).

## D · Our questions, tareas 1–2 (`questions/game/t1–t2`)

- t1 100 (75 choice / 25 V-F), t2 40 (30 / 10); difficulty 40/40/20; answers balanced.
- Checked against the BOE text of the Constitution and the LOREG.
- Left out on purpose: municipal election date rule, Senate ballot colour, Senate and European Parliament seat totals, renta campaign dates, marriage of minors, loss of nationality.
- For the fact-check (H): t1 asks about 12 de octubre and t2 about nationality by residence (art. 11); E may cover the same in t5. Plain-fact statements to check: the royal family lives in La Zarzuela; CCOO and UGT as the main unions.

## C · UI kit, sounds, gallery (`src/shared/ui`, `src/shared/sound`, `src/dev`, `src/styles`)

- Props → events: `AppButton` (variant, size, type, disabled, block → click) · `PixelPanel` (tone, title, padding, shadow, tag) · `AppModal` (open, title, placement 'center'|'sheet', closeLabel; slots default/footer → close) · `GameTitle` (size, tagline) · `ModeCard` (title, subtitle, progress, bestRung, disabled, note, actionLabel → start) · `QuestionCard` (topic, rung, comunidad, question; slots default/footer) · `AnswerOption` (index, text, state `EAnswerState`, locked → choose(index)) · `ConfirmBar` (prompt, confirmLabel, cancelLabel, disabled, keyHints → confirm, cancel) · `LifelineBar` (used, unavailable, disabled → use(ELifeline)) · `AudienceChart` (percentages, removed, caption) · `FriendCall` (friendName, calling, message, optionIndex, optionText, confidence 0–100 → hangUp) · `InfoButton` (disabled, label, attention → open) · `InfoSheet` (open, explanation, correct, answerIndex, answerText, question → close) · `PrizeLadder` (rungs, current, status, points, safePoints, layout 'auto'|'full'|'strip') · `TopicBars` (perTopic) · `SoundToggle` (muted → update:muted).
- Keyboard: `useAnswerKeys({ optionCount, selected, enabled, canChoose?, choose, confirm, cancel })`. Sound: `sound.play(ESound.X)`, `sound.setMuted(muted)`.
- Kit types in `shared/ui/types.ts`: `EAnswerState`, `ELadderStatus`, `LadderRung`. `ELifeline` is now one shared enum in `contracts/lifeline.ts` (lead), used by both the round rules and the kit.
- Numbers and option letters use the `hud-number` utility (in Pixelify Sans "5" reads like "S").
- Theme: every colour comes from the pixel palette; `data-theme` on `<html>` overrides the system setting. `AppModal` is a native `<dialog>`.
- Lead changed the confirm prompt to "¿Confirmas tu respuesta?" (the old default echoed a TV quiz-show catchphrase) and the `theme-color` metas.

## S · Sprites and avatar (`src/shared/pixel/sprites`, `src/features/avatar`)

- Sprite sizes: her character 14×18 (`AVATAR_WIDTH`, `AVATAR_HEIGHT`); frames walk 4, idle 2, cheer 2, sad 2 (`avatarFrameCount`, frames wrap, cached per look+frame); stops 9×9 (centre on the anchor); flag 14×16 (pole foot bottom-left); plane 24×12 and boat 24×20 (facing right); fireworks 6 frames of 15×15; landmarks 16×16. Catalog also exports `SKIN_COLORS`, `HAIR_COLORS`, `OUTFIT_COLORS`.
- Avatar API: `createAvatarService(store, log?)` → `load()` (saved or default), `save(look)` (validates, throws InvalidInput), `reset()`. Stored under `avatar` as `{version: 1, look}`.
- `AvatarEditor` (prop `look` → `change(look)` on every pick, `save(look)` from "Guardar", `cancel()`; "Por defecto" button). `AvatarCanvas` (`look`, `pose`, `scale`, `animate`, `label`; reduced motion; pauses when hidden) — reusable on Home.
- No avatar Pinia store yet: the lead gives it to G (`src/features/avatar/view/avatarStore.ts`).

## F · Official 2026 questions (`questions/official-2026`, `scripts/extractOfficial.ts`)

- 300 questions, matching the manual's answer key ("SOLUCIONES"): T1 120, T2 36, T3 24, T4 36, T5 84. 264 choice, 36 true/false (all in tarea 2). Difficulty 166 / 97 / 37.
- Word for word, the manual's own typos kept (e.g. 1031 "municiales"). Re-running the script gives a byte-identical file and keeps the explanations.
- Date-dependent answers: 5009 (19 weeks of birth leave, 2025 reform), 1062 (49 million people), 1103 (no woman prime minister yet) — explanations tie them to the manual's date.
- For the fact-check (I): look first at 4023 (Daniel Molina's record) and 5046 (footwear trade balance).

## M · Map (`src/features/map`, `scripts/buildMap.ts`)

- `RouteMap.vue`: props `look`, `stop` (0–16), `reached`, `best` (stop index, -1 none; gold frame), `state` ('idle' | 'travelling' | 'lost' | 'won'); emits `arrived(stop)` after a 1.5 s leg. Reduced motion, or a change other than +1 (new round, jump): she appears at once and `arrived` fires at once. Nothing on mount. `aria-label` "Estás en Andalucía, parada 2 de 17".
- viewBox 0 0 1000 800; 6–39 vertices per comunidad; shared simplified borders (no gaps). Whole map when it fits at ≥ 0.55 CSS px per unit (laptop, tablet); on a phone it zooms to ~1 px per unit and pans with her; zoom snaps so sprite pixels stay crisp.
- `spainLowPoly.json` 4.6 KB; `pnpm build:map` rebuilds it byte for byte; `--preview x.svg` writes a picture.
- Neighbouring countries in grey (Ceuta and Melilla on the African coast); Canarias at 0.68 of the mainland scale; landmark sides fixed per comunidad and tested not to cover stops, her, flags or the route.
- Compose it only in `src/screens/` (features can't import each other); on a phone the question sheet must not cover her.

## H · Fact-check of our questions (`docs/fact-check.md`)

- 13 of 300 changed (t1 1, t2 2, t3 2, t4 2, t5 6); counts and IDs kept. Main ones: the Constitution has four reforms (the 4th, art. 69.3 for Formentera's senator, BOE 20 May 2026 — verified by the lead); Cela added to the Nobel list; amparo "general rule" wording; 10 cross-file duplicates replaced.
