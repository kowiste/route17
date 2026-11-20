# Route 17

A quiz-show game to prepare the CCSE, the Instituto Cervantes test for Spanish nationality. A round is 17 questions, one per comunidad autónoma, on a route that ends in Madrid: a prize ladder with safe rungs, three lifelines (50:50, el público, llamar a un amigo), and an ⓘ with the explanation after every answer. Two modes play the same; only the questions change:

- **Modo oficial**: the questions of the Instituto Cervantes manual, word for word (`questions/official-YYYY/`).
- **Modo juego**: our own questions on the same topics, with more game vibe (`questions/game/`).

It's an original game: never use the name, logo, set, music or catchphrases of any TV quiz show. Everything on screen is in Spanish. It runs on a phone and on a laptop. There is no backend: progress is saved in the browser.

Follow the architecture described in `ARCHITECTURE.md`. This file says how it maps to a game in the browser. `PLAN.md` is the implementation plan and says who owns which paths.

## Stack

TypeScript (strict, `noUncheckedIndexedAccess`) + Vue 3 (`<script setup>`) + Pinia + vue-router (hash history) + Tailwind 4 + Zod + Vitest (+ @vue/test-utils, happy-dom), pnpm.

- `pnpm dev`: dev server on port 5190 (`/#/dev` shows the component gallery)
- `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test`, `pnpm build`
- `pnpm check`: typecheck + lint + format check + tests; the pre-commit hook runs it (`pnpm hooks` installs the hook)

## How the layers map to the game

| ARCHITECTURE.md | Here |
|---|---|
| `domain/` | The rules: the question set and its invariants, the deck (which questions she gets), the round (ladder, safe rungs, answering, lifelines). Plain TS, no Vue, no browser. Unit-tested. |
| `app/` | Services that run the steps in order: start a round, answer, use a lifeline, finish. No Vue, no browser. |
| `infra/` | Ports' implementations: the question-file loader (`import.meta.glob`), the progress repository on `shared/storage`. Stored and loaded data is parsed with Zod. |
| `view/` (the presentation layer, `api/` in the doc) | Vue screens and the Pinia store of each feature. Shows state and passes on clicks and keys; never decides a rule. |
| `shared/ui/` | The UI kit: presentational components (props in, events out), no stores, no services. |
| `contracts/` | What features share: question types, `IQuestionCatalog`, `IDeck`, the comunidades, the route, her avatar's look. |
| `shared/pixel/` | The pixel-art engine, the palette and the sprite catalog. |
| `screens/` | The app's screens: compose several features' views (the map, the question panel, the avatar) with the UI kit. Like `bootstrap/`, may import any feature's `view/`; never contains rules. |
| `bootstrap/` | Wiring: the router, the deps container. May import everything. |

- Features: `questions` (the sets and the catalog), `progress` (the deck and her progress), `round` (the show), `map` (the low-poly map of Spain and her walk along the route), `avatar` (her character), `home`, `settings`.
- A feature never imports another feature; it uses `contracts/`. `domain/`, `app/` and `contracts/` never import Vue, Pinia, the router, the UI kit or browser APIs. `src/test/boundaries.test.ts` fails otherwise.
- All randomness goes through `shared/random` (`Random`, seeded), so a round or a lifeline can be replayed in a test. Never call `Math.random()` elsewhere.
- Errors: domain and app throw `AppError` (`shared/errors`); screens decide how to show them.
- Logging goes through `shared/logger`; no `console.*` elsewhere.

## Questions

- The format is `src/features/questions/domain/questionFileSchema.ts`; `src/features/questions/test/questionFiles.test.ts` checks every file. A set is a folder under `questions/` with a `set.json` and one or more question files.
- A new manual edition is a new folder, `questions/official-YYYY/`; the game plays the newest one.
- Game questions are original: never copy the manual's wording. Their facts must be exact; leave out facts that change (who holds an office apart from the Crown, populations, seat counts that vary).
- The official set reproduces the Instituto Cervantes manual: it may only be hosted somewhere private (decided with the hosting).
- The manual PDF goes in `manual/`, which is git-ignored.

## Look

- **Retro, 2D, no 3D.** A low-poly SVG map of Spain (flat-coloured comunidades); her pixel-art character walks the route between stops like an old console world map (our own art: nothing from Mario or any other game).
- **Pixel art is drawn in code**: sprites are rows of characters (`shared/pixel/sprite.ts`), drawn on a `<canvas>` at an integer scale with no smoothing, or as crisp `<rect>` runs inside the SVG map. Their colours come only from `shared/pixel/palette.ts`. The sprite catalog (`shared/pixel/sprites/index.ts`) is the one entry point to every sprite.
- **The UI around the map** is retro too: pixel font (Pixelify Sans, `@fontsource/pixelify-sans`) for titles, labels, buttons and the HUD; a plain readable font for question text, options and explanations, which she has to read comfortably.
- UI colours are the tokens in `src/styles/theme.css` (light and dark), used through their Tailwind names (`bg-surface`, `text-ink`, `bg-primary`…). No hex values in components.
- Responsive: phone portrait first (the map follows her, the question is a sheet at the bottom), and a laptop layout that uses the width (whole map, question panel at the side).
- Keyboard on the laptop: A/B/C (or 1/2/3) to choose, Enter to confirm, Esc to cancel.
- Respect `prefers-reduced-motion`: moves happen without the walk animation. Animate only while something moves; pause when the tab is hidden.

## Conventions

- Functions are `function` declarations or class methods, never `const` arrow functions (inline callbacks are fine).
- `<script setup>` order: imports, props, emits, state, stores/services, computed, methods, lifecycle, watch.
- Named exports only (Vue components are the exception). Enums are string-valued with an `E` prefix. IDs end in `ID`.
- No `any`, no `as unknown as`, no `@ts-ignore`, no non-null `!`.
- Code, names and comments in English; everything the player sees in Spanish.
- Tailwind classes; a `<style>` block only for what Tailwind can't express.

## Testing a change

- Every change comes with its tests; a change isn't done until `pnpm check` passes.
- Domain and services: unit tests next to the code (`*.test.ts`), with seeded `Random` and the fakes in `src/test/fixtures/`.
- Components: tests with @vue/test-utils for their events and states.
- Load the page and check it renders with no console errors. Don't play-test by sending synthetic clicks or key events: how the game *plays* is checked by the people who play it.
