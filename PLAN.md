# Route 17 — implementation plan

A quiz-show game to prepare the CCSE (Spanish nationality test), in retro pixel art. One round = 17 questions, one per comunidad autónoma. Her character (pixel art) starts in Canarias and travels a low-poly map of Spain like an old console world map: every right answer takes her to the next comunidad, a wrong one ends the trip, Madrid is the finish. Two modes play the same; only the questions change:

- **Modo oficial**: the questions of the Instituto Cervantes manual, word for word (`questions/official-YYYY/`).
- **Modo juego**: our own questions on the same topics, worded with more game vibe (`questions/game/`).

Everything on screen is in Spanish. Works on her phone and her laptop. No backend: progress is saved in the browser. 2D only, no 3D.

## How the work is split

1. **Phase 0 (lead, done)** laid down what everyone builds against: tooling, every dependency, the folder skeleton, the contracts, the question-file format and its test, the pixel-sprite engine with placeholder sprites, the guard tests. `package.json`, the lockfile, the configs, `src/contracts/`, `src/shared/` (except what an agent owns below) and the question-file schema are frozen; a change there goes through the lead.
2. **Phase 1 (7 agents in parallel: A, B, C, M, S, D, E; F once the manual PDF is in `manual/`)**: each agent owns its paths and nothing else.
3. **Phase 2 (G, H in parallel; I after F)**: the screens wired together, and an independent fact-check of the questions.
4. **Phase 3 (lead)**: integration check, render on phone and laptop sizes; then you and she play-test.

```
Phase 0 ──► A deck ──────────────┐
            B round rules ───────┤
            C UI kit ────────────┤
            M map ───────────────┼──► G screens ────┐
            S sprites + avatar ──┤                   ├──► Phase 3
            D questions 1-2 ─────┤                   │
            E questions 3-5 ─────┴──► H fact-check ──┘
            F official 2026 (needs the PDF) ──► I fact-check official
```

### Rules for every agent

- Read `CLAUDE.md`, `ARCHITECTURE.md` and your section of this plan before starting.
- Edit only the paths you own. If you need something outside them (a contract, a dependency, a shared helper, a sprite), stop and say so in your report; don't edit it. Code against the contracts and the placeholders; the real thing arrives from the other agent.
- Never run `pnpm add` / `pnpm install`, never edit `package.json`, the lockfile or any config.
- Never commit, push, switch branches or create worktrees.
- Never start a dev server, never kill a process (by port or otherwise), never touch Docker.
- Never download anything; if you need a file from the internet, say so.
- Done means: your tests pass (`pnpm vitest run <your paths>`), `pnpm typecheck` and `pnpm lint` show no error **in your paths** (errors in another agent's paths are theirs), `pnpm format` run on your files, and your report lists the files you created, the tests, and any open question.

---

## Phase 0 — foundation (lead, done)

- **Tooling**: Vite + Vue 3 + TypeScript (strict, `noUncheckedIndexedAccess`) + Tailwind 4 + Pinia + vue-router (hash history) + Zod + Vitest + @vue/test-utils + happy-dom + ESLint + Prettier + pdfjs-dist + Pixelify Sans (`@fontsource/pixelify-sans`). Scripts: `dev` (port 5190), `typecheck`, `lint`, `format`, `test`, `check`, `build`, `extract:official`, `build:map`. The pre-commit hook runs `pnpm check`.
- **Docs**: `ARCHITECTURE.md`, `CLAUDE.md`, `README.md`.
- **Contracts** (`src/contracts/`):
  - `question.ts`: `QuestionID`, `SetID`, `ETopic` (the 5 tareas, string values `gobierno`, `derechos`, `territorio`, `cultura-historia`, `sociedad`), `TOPICS` (number and title of each), `EQuestionType`, `TRUE_FALSE_OPTIONS`, `EMode`, `Difficulty`, `QuestionData`, `QuestionRef`.
  - `catalog.ts`: `IQuestionCatalog` — `sets()`, `newestSet(mode)`, `index(setID)`, `questions(setID, ids)`.
  - `deck.ts`: `IDeck` — `deal(setID, count)`, `finish(setID, outcome)` (answers + unreached), `summary(setID)`, `stats(setID, ids)`, `reset(setID)`.
  - `comunidad.ts`: `EComunidadID` and `COMUNIDADES` (ISO code, short name, full name, capital).
  - `route.ts`: `ROUND_LENGTH` (17), `ROUTE` (the order), `SAFE_RUNGS` (5 and 10).
  - `avatar.ts`: `AvatarLook` (skin, hair style, hair colour, outfit), `DEFAULT_AVATAR_LOOK`, `EAvatarPose`.
- **Shared**: `random/` (seeded `Random`), `errors/appError.ts`, `logger/`, `storage/` (key/value store over `localStorage`, safe when blocked), `pixel/` (sprite engine: `Sprite` as rows of characters + legend, `drawSprite`, `recolor`, `flipX`, `spriteProblems`; `palette.ts`; `sprites/index.ts`, the sprite catalog with placeholder art).
- **Question format**: `src/features/questions/domain/questionFileSchema.ts` and `src/features/questions/test/questionFiles.test.ts`; `questions/game/set.json` and two example questions per tarea.
- **Tests**: `src/test/boundaries.test.ts` (domain/app/contracts stay pure; no feature imports another), `src/shared/pixel/sprite.test.ts` (every catalog sprite is well formed), `src/shared/random/random.test.ts`.
- **Fixtures** (`src/test/fixtures/questions.ts`): `sampleQuestions()`, `FakeCatalog`, `FakeDeck`.
- **Router and placeholder screens**: Home, Round (`/jugar/:mode`), Result, Progress, Settings, `/dev` gallery (development only).

### The question files

One folder per set, with a `set.json` and one or more question files merged by the loader. A new edition is a new folder (`official-2027/`).

```
questions/
├── game/
│   ├── set.json                 {"setID": "game", "mode": "game", "title": "Modo juego"}
│   ├── t1-gobierno.json         [ question, … ]
│   ├── t2-derechos.json
│   ├── t3-territorio.json
│   ├── t4-cultura-historia.json
│   └── t5-sociedad.json
└── official-2026/
    ├── set.json                 {"setID": "official-2026", "mode": "official", "edition": 2026, "title": "Manual CCSE 2026"}
    └── questions.json
```

```json
{
  "id": "g-t1-001",
  "topic": "gobierno",
  "type": "choice",
  "question": "Empezamos fuerte: ¿quién es el jefe del Estado en España?",
  "options": ["El presidente del Gobierno", "El rey", "El presidente del Tribunal Constitucional"],
  "answer": 1,
  "explanation": "Según el artículo 56 de la Constitución de 1978, el rey es el jefe del Estado. …",
  "difficulty": 1
}
```

---

## Phase 1 — in parallel

### A · Questions catalog and the deck

**Owns**: `src/features/questions/{domain,app,infra}/**` (not `questionFileSchema.ts`, not `test/questionFiles.test.ts`), `src/features/progress/{domain,app,infra}/**`.

- `QuestionSet` entity (the invariants of the file test; `difficulty` defaults to 2 here, in the domain), the loader (`import.meta.glob('/questions/**/*.json')`, Zod-parsed, merged by folder), `questionCatalog` implementing `IQuestionCatalog`.
- `Deck` (one per set), the rules:
  - The set is shuffled into an order; `deal(n)` takes **first the missed questions that are due** (at most 5 per round), then the next ones in the order. Each `deal` counts as a round.
  - A missed question comes back **3 rounds later**.
  - `finish()` records the answers and puts the unreached questions back at the **front** of the order. If a dealt round is never finished (she closed the app), its questions come first in the next `deal`.
  - When the order runs out, a new cycle starts with a new shuffle; the cycle number is kept.
  - She sees every question once before any repeats (apart from missed ones coming back).
  - If the set's file changes (questions added or removed), new IDs join the order and removed IDs are dropped, without losing the rest of her progress.
  - `summary()`: seen, mastered (her last answer to it was right), total — overall and per tarea; cycle; rounds played.
  - `stats()`: times seen, times wrong, last answer.
- `progressRepository` on the `KeyValueStore` port: one key per set, Zod-parsed; corrupt or old data → start fresh and log a warning.
- `progressService` implementing `IDeck`.
- **Tests**: with N questions answered right, every question is dealt within ⌈N/17⌉ rounds; a missed question returns after 3 rounds and at most 5 come back per round; unreached and unfinished questions come first next time; set changes keep progress; corrupt storage → fresh; same seed → same deal; the catalog loads the real `questions/` folder.

### B · The round rules

**Owns**: `src/features/round/{domain,app}/**`.

- `ladder.ts`: points per rung — 100, 200, 300, 500, **1.000**, 1.500, 2.000, 3.000, 5.000, **7.500**, 10.000, 15.000, 20.000, 30.000, 50.000, 75.000, 100.000; the safe rungs are `SAFE_RUNGS`; rung 17 also wins "¡Nacionalidad!". Rung n is the comunidad `ROUTE[n - 1]`.
- `Round` aggregate, a state machine (`playing` → `won` | `lost` | `stopped`):
  - 17 questions sorted easy → hard (by `difficulty`; within a level, ones she failed before go later; ties random with the seed).
  - Answering is two steps: `select(option)` then `confirm()` ("¿Confirmas tu respuesta?"); the selection can change until confirmed.
  - Wrong answer → `lost`, she keeps the last safe rung's points. `stop()` → `stopped`, keeps the current points. 17 right → `won`.
  - Every answered question is recorded right/wrong; unreached ones are returned.
- Lifelines (each once per round, domain services that take `Random`):
  - **50:50**: removes one wrong option; not allowed on true/false questions.
  - **El público**: percentages per option summing to 100; the right one gets most of the vote, less sure on harder questions (difficulty 1: 60–85 %, 2: 45–70 %, 3: 30–55 %; on difficulty 3, one time in 10 a wrong option leads).
  - **Llamar a un amigo**: the friend names an option and how sure they are; right 90 % / 75 % / 60 % of the time by difficulty; a few Spanish phrasings.
- `roundService`: `start(mode)` (the set from `IQuestionCatalog.newestSet`, 17 IDs from `IDeck.deal`, her stats from `IDeck.stats`), `select`, `confirm`, `useLifeline`, `stop`; at the end, `IDeck.finish`. Returns plain state objects the screens can show (current rung, comunidad, question, options with removed ones, points, safe points, lifelines left, last answer's result and explanation, status).
- Her record: the furthest rung she has ever reached per set, through a port `IRoundRecords` (`best(setID)`, `save(setID, rung)`) that B defines in `round/domain/interface.ts`; the service updates it when a round ends. G implements it on the `KeyValueStore` in phase 2; B tests with an in-memory fake.
- **Tests**: the ladder and safe points, every state transition and the invalid ones (confirm before select, a lifeline twice, 50:50 on true/false), the lifeline odds over many seeded runs, the service with `FakeCatalog` and `FakeDeck`.

### C · UI kit, retro look

**Owns**: `src/shared/ui/**`, `src/shared/sound/**`, `src/dev/**`, `src/styles/theme.css`.

Presentational Vue components only: props in, events out, no stores, no services. Each one in the `/dev` gallery with fixture data, and a component test for its events.

- **Look**: retro console UI. Pixel font (Pixelify Sans) for titles, labels, buttons and the HUD; a readable font for question text, options and explanations. Chunky pixel borders (stepped corners), panels like old game dialog boxes, a limited palette. Retheme `theme.css` (light and dark) to match the pixel palette in `shared/pixel/palette.ts`.
- `AppButton`, `PixelPanel`, `AppModal`, `GameTitle` (the "Route 17" logo in pixel style).
- `ModeCard` (title, subtitle, progress, disabled + note) → `start`.
- `QuestionCard` (tarea label, rung and comunidad, question text, slot for options).
- `AnswerOption` (letter, text, state: idle / selected / correct / wrong / removed) → `choose`. Keyboard: A/B/C or 1/2/3 to choose, Enter to confirm, Esc to cancel.
- `ConfirmBar` ("¿Confirmas tu respuesta?") → `confirm` / `cancel`.
- `LifelineBar` (50:50, público, amigo: used / disabled) → `use(kind)`; `AudienceChart` (pixel bars with percentages); `FriendCall` (a retro phone dialog: message, option, how sure).
- `InfoButton` + `InfoSheet` (the ⓘ: the explanation after answering).
- `PrizeLadder` (17 rungs: comunidad, points, safe; current; status) — full list on the laptop, a slim strip on the phone.
- `TopicBars` (per tarea: mastered / seen / total).
- `shared/sound`: chiptune sounds made with Web Audio (square and triangle waves): select, confirm, correct, wrong, step (walking), win jingle; a mute switch.

### M · The map

**Owns**: `scripts/buildMap.ts`, `src/features/map/**`.

The map is a **low-poly SVG** (the user's call: no real-detail map, no pixel raster). The sprites on it stay pixel art.

- **Map data**: `scripts/buildMap.ts` uses Natural Earth's admin-1 GeoJSON (public domain; `mapdata/`, git-ignored) only as a one-off source of outlines: it merges the provinces into the 17 comunidades (Ceuta and Melilla too, drawn but not on the route), simplifies each one hard into a low-poly polygon (about 6–20 vertices; islands as a few small polygons), projects them, puts Canarias in an inset box at the bottom left, and writes the small committed file `src/features/map/infra/spainLowPoly.json`: polygons in one viewBox with integer coordinates, plus one anchor point per comunidad inside its polygon. Tests check every comunidad has a polygon, its anchor is inside it, and the IDs match `EComunidadID`.
- **Domain** (`map/domain/`): the legs between stops and how she travels each one (`walk`; `plane` Canarias → Andalucía; `boat` Comunitat Valenciana → Baleares and Baleares → Cataluña), the path of each leg (dots; a dashed line over the sea), the travel timeline (position along the path over time).
- **View** (`map/view/RouteMap.vue`): an SVG with flat fills per comunidad (colours from `PIXEL_PALETTE`), a dark border stroke, the sea, the route's dots (filled up to where she has been), and the pixel sprites from the catalog drawn crisply inside the SVG by `PixelSprite.vue` (`<rect>` runs, `shape-rendering="crispEdges"`): the stops, the checkpoint flags on the safe rungs, the landmarks next to the stops, her character (walking, idle, cheering in Madrid, sad when she loses), the boat and the plane, fireworks in Madrid.
  - Props: `look: AvatarLook`, `stop: number` (0–16, index in `ROUTE`), `reached: number` (furthest stop this round), `best: number` (furthest ever, marked on the map), `state: 'idle' | 'travelling' | 'lost' | 'won'`. Emits `arrived(stop)` when a travel animation ends.
  - When `stop` goes up by one, she travels that leg (about 1.5 s; walk, boat or plane), then `arrived` fires. Reduced motion: she appears at the next stop at once.
  - Camera: the SVG `viewBox`. On the laptop the whole map fits; on a phone in portrait a window around her pans as she travels.
  - Animates only while something moves (idle bob at a low frame rate); stops when the tab is hidden. The SVG has an `aria-label` saying where she is ("Estás en Andalucía, parada 2 de 17").
- **Tests**: the map data (above), the leg modes, the path of every leg starts and ends at its stops, the travel timeline; the component test checks the events.

### S · Sprites and the avatar

**Owns**: `src/shared/pixel/sprites/**`, `src/shared/pixel/palette.ts` (may add colours, never remove), `src/features/avatar/**`.

- **The sprite art**, replacing the placeholders in `shared/pixel/sprites/` and keeping the catalog's signatures:
  - Her character (about 12 × 16): body with legend keys for skin, hair and outfit, recoloured from `AvatarLook`; the 5 hair styles; poses idle (2 frames, a bob), walk (2–4 frames), cheer, sad. Faces the viewer; `flipX` for walking left.
  - Stops (ahead / current / done), the waving checkpoint flag (2 frames), the boat with her in it (2 frames), the plane (2 frames), fireworks (a short loop).
  - **17 landmarks** (about 16 × 16), one per comunidad, recognisable in a few pixels: Teide (Canarias), Giralda (Andalucía), cathedral of Murcia, Ciudad de las Artes y las Ciencias (C. Valenciana), cathedral of Palma (Baleares), Sagrada Família (Cataluña), Basílica del Pilar (Aragón), the San Fermín bull run (Navarra), a wine barrel and grapes (La Rioja), Guggenheim (País Vasco), Altamira bison (Cantabria), hórreo (Asturias), cathedral of Santiago (Galicia), aqueduct of Segovia (Castilla y León), Roman theatre of Mérida (Extremadura), windmills (Castilla-La Mancha), Puerta de Alcalá (Madrid).
  - Our own art in a classic 16-bit-ish style; nothing copied from any game.
- **Avatar feature**: `domain/` (the look and its validation; `DEFAULT_AVATAR_LOOK`), `app/avatarService.ts` (load, save), `infra/` (repository on `KeyValueStore`, Zod-parsed, corrupt → default), `view/AvatarEditor.vue` (pick skin, hair style, hair colour, outfit with a live preview on a canvas; Spanish labels).
- **Tests**: the catalog test in `shared/pixel/sprite.test.ts` passes for every look, pose and frame; the avatar service and repository; the editor's events.

### D · Our questions, tareas 1–2

**Owns**: `questions/game/t1-gobierno.json`, `questions/game/t2-derechos.json`.

### E · Our questions, tareas 3–5

**Owns**: `questions/game/t3-territorio.json`, `questions/game/t4-cultura-historia.json`, `questions/game/t5-sociedad.json`.

**For D and E**:

- Keep the example questions that are already there; add to them.
- Topics are the CCSE's: 1 Gobierno, legislación y participación ciudadana · 2 Derechos y deberes fundamentales · 3 Organización territorial de España, geografía física y política · 4 Cultura e historia de España · 5 Sociedad española.
- Targets: t1 100, t2 40 (D); t3 40, t4 50, t5 70 (E). About ¾ `choice` and ¼ `trueFalse`; difficulty about 40 % 1, 40 % 2, 20 % 3.
- Original questions in Spanish, worded with game vibe (a short playful lead-in, travel and map jokes are welcome); never copy the manual's wording. The facts must be exact: Constitución de 1978 for 1–2; well-established facts only. No facts that change (who holds an office apart from the Crown, populations, seat counts that vary); if a date matters, say it.
- Wrong options are plausible but clearly wrong; no "all of the above", no trick wording.
- Every question has an explanation of 1–3 sentences, plain Spanish, that teaches the fact.
- IDs `g-t<n>-<nnn>`. Run `pnpm vitest run src/features/questions/test` before finishing.

### F · Official 2026 questions (starts once the manual PDF is in `manual/`)

**Owns**: `scripts/extractOfficial.ts`, `questions/official-2026/**`.

- The script reads the PDF with `pdfjs-dist`, extracts each question, its options, its tarea and the answer from the answer key, and writes `questions/official-2026/questions.json` with IDs `o26-<manual number>`. Word for word, no corrections.
- Then writes our own explanation (1–3 sentences) and a difficulty for each question in the same file.
- The script reports how many questions per tarea it found; it must match the manual's own count.

---

## Phase 2 — in parallel

### G · Screens and wiring

**Owns**: `src/screens/**` (the composed screens), `src/features/{questions,progress,round}/view/**`, `src/features/round/infra/**`, `src/features/avatar/view/avatarStore.ts`, `src/features/home/**`, `src/features/settings/**`, `src/bootstrap/**`, `src/App.vue`, `src/main.ts`, `index.html`.

- `bootstrap/deps.ts`: one container with the catalog, the deck, the round service, the avatar service; provided to the app.
- Pinia stores (one per feature, in `view/`) that call the services and hold what the screens show.
- `IRoundRecords` on the `KeyValueStore` in `round/infra/` (best rung per set).
- Screens from C's kit, M's map and S's avatar:
  - **Home**: the title, her character, the two modes with their progress ("Pendiente" for the official mode until a set exists), Progreso, Ajustes.
  - **Round**: the map with the question panel (a sheet at the bottom on the phone, a side panel on the laptop); a question appears when she arrives at a stop; after confirming, right → ⓘ available, a moment later she travels to the next stop; wrong → the right answer shown, the ⓘ, she looks sad, then the result.
  - **Result**: points, how far she got, the round's questions with right/wrong and each ⓘ, Jugar otra vez.
  - **Progress**: per mode and tarea; reset a mode's progress (with a confirm).
  - **Settings**: her name, her character (S's editor), sound on/off.
- Component tests for the stores and the main flows.

### H · Fact-check of our questions

**Owns**: `questions/game/**` (D and E are done by then), `docs/fact-check.md`.

A fresh agent that hasn't seen the writers' reasoning. Checks every question and explanation against well-known sources (Constitución de 1978, official sites), fixes what's wrong or ambiguous, and lists every change with its reason in `docs/fact-check.md`.

### I · Fact-check of the official explanations (after F)

**Owns**: the `explanation` and `difficulty` fields of `questions/official-2026/questions.json`, `docs/fact-check-official.md`. Never changes the manual's questions, options or answers.

---

## Phase 3 — lead

`pnpm check` and `pnpm build`; render at phone (375 × 812) and laptop (1440 × 900) sizes, light and dark, with no console errors; read the agents' reports and close their open questions. Then you and she play-test. Hosting is decided after that.
