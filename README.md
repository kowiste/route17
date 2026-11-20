# Route 17

Prepara la prueba CCSE de la nacionalidad española jugando: 17 preguntas por ronda, una por comunidad autónoma, de camino a Madrid.

- **Modo oficial**: las preguntas del manual del Instituto Cervantes, tal cual.
- **Modo juego**: nuestras propias preguntas sobre los mismos temas.

## Development

```sh
pnpm install
pnpm hooks      # installs the pre-commit hook
pnpm dev        # http://localhost:5190
pnpm check      # typecheck + lint + format + tests
pnpm build      # static site in dist/
```

## Questions

Question sets live in `questions/`, one folder per set. The format is in `src/features/questions/domain/questionFileSchema.ts`; `pnpm test` checks every file.

**A new edition of the manual**: put the PDF in `manual/`, run `pnpm extract:official`, check the result in `questions/official-YYYY/`, then write the explanations. The game plays the newest edition.

## Build variable

| Variable | Default | What it does |
|---|---|---|
| `VITE_OFFICIAL` | included | `false` leaves the official questions (the Instituto Cervantes manual) out of the build entirely; the official mode then shows "Pendiente". Set it for a site that must not carry them. |

```sh
VITE_OFFICIAL=false pnpm build   # a build without the official questions
```

## Test site (GitHub Pages)

`.github/workflows/pages.yml` runs on every push to `main`: it builds the site with both modes (game and official questions) and deploys it to this repo's GitHub Pages, served at https://kowiste.github.io/route17/. It needs Settings → Pages → Source set to "GitHub Actions"; no secret or token.

See `CLAUDE.md` for the architecture and conventions, `PLAN.md` for the implementation plan.
