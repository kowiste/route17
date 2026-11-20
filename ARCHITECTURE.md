# TypeScript Backend Architecture Reference

Generic architecture patterns for any TypeScript backend — a REST API, a game server, an accounting app, a worker service. Domain-agnostic and infrastructure-agnostic: concrete technologies (HTTP framework, database, auth provider, message broker) are replaceable adapters at the edges; the layering never changes.

**How to use this document with an AI assistant:**
1. Copy this file into the new repository as `ARCHITECTURE.md`.
2. In the project's `CLAUDE.md` (or equivalent) add: *"Follow the architecture described in ARCHITECTURE.md."*
3. Tell the AI what the product is ("this is a multiplayer game backend", "this is an invoicing app") and ask for features ("create a `player` feature", "create an `invoice` feature with CRUD"). The AI scaffolds them with the structure below.

The running example uses a `task` feature. Replace `task` with any feature name.

---

## Table of Contents

- [Core Rules](#core-rules-non-negotiable)
- [Reference Stack](#reference-stack-defaults-all-swappable)
- [Directory Structure](#directory-structure)
- [Layer Dependency Direction](#layer-dependency-direction)
- [Domain Layer](#domain-layer)
- [Application Layer](#application-layer)
- [Infrastructure Layer](#infrastructure-layer)
- [Presentation Layer](#presentation-layer-api)
- [Request Context (AsyncLocalStorage)](#request-context-asynclocalstorage)
- [Error Handling](#error-handling)
- [Dependency Injection & Bootstrap](#dependency-injection--bootstrap)
- [Cross-Feature Communication](#cross-feature-communication)
- [Configuration](#configuration)
- [Logging](#logging)
- [Testing Strategy](#testing-strategy)
- [TypeScript Conventions](#typescript-conventions)
- [Adapting to Project Types](#adapting-to-project-types)
- [New Feature Checklist](#new-feature-checklist)
- [Data Flow Summary](#data-flow-summary)

---

## Core Rules (non-negotiable)

1. **Business logic lives in the domain layer only** — entities, value objects, domain services. NEVER in the app/service layer (services only orchestrate), NEVER in handlers (they only parse requests and shape responses), NEVER in repositories (they only persist and retrieve), NEVER in infra mappers (pure field mapping — no conditionals, no defaults, no ID/timestamp generation), NEVER in the database (no smart defaults in SQL). The database stores exactly what it is told. The handler passes data through. The service orchestrates. **The domain decides.**
2. **Framework and driver imports are quarantined.** `domain/` and `app/` import nothing from the HTTP framework, the database client, or any SDK. Those names may only appear in `infra/`, `api/`, `server/`, and `bootstrap/`. Swapping Fastify for a WebSocket loop, or Postgres for SQLite, must not touch domain or app code.
3. **Validate at runtime on every boundary.** TypeScript types are erased at runtime — a compiled type is not a guarantee. Every input crossing into the system (HTTP body, WS message, queue payload, env var) is parsed with a schema (Zod) before use.
4. **Two validation tiers.** Schemas validate *shape* (required, min/max, format) on commands. Entities validate *business rules* (state transitions, invariants) in their methods. Don't duplicate business rules into schemas.
5. **Explicit dependency injection.** Plain constructor injection, feature factory functions, one typed deps container. No DI framework, no decorators, no reflection, no service locator magic.
6. **Errors are `AppError`.** Domain and app layers throw typed `AppError`s. Only the presentation layer converts them to transport responses (HTTP status, WS error frame). Internal details never leak to clients.
7. **Repositories speak domain.** They accept and return domain entities, never DB rows. `null` means not found — the *service* decides whether that is an error.
8. **IDs and timestamps are created in the domain** (entity constructors), never in mappers, repositories, or the database.
9. **All date/time math goes through `shared/time/timeutil.ts`** (startOfDay, daysAgo, …). Never inline date arithmetic; add helpers to timeutil instead.
10. **Async discipline:** `async/await` everywhere, no floating promises (enforced by lint), no blocking the event loop (CPU-heavy work goes to a worker thread behind a port).

---

## Reference Stack (defaults, all swappable)

| Concern | Default | Swap examples | Allowed import locations |
|---|---|---|---|
| Language / runtime | TypeScript (strict) on Node LTS, ESM | Bun, Deno | everywhere |
| HTTP framework | Fastify | Express, Hono, WS server, none | `api/`, `server/`, `bootstrap/` |
| Database | PostgreSQL + Kysely (typed SQL builder) | Prisma, Drizzle, SQLite | `infra/`, `bootstrap/` |
| Validation | Zod | Valibot | `domain/` (schemas), `api/`, `shared/config` |
| Logging | pino behind a `Logger` interface | console adapter | adapter in `shared/logger` |
| Testing | Vitest (+ Testcontainers for integration) | Jest | test files |
| IDs | UUID v7 via `shared/id` | nanoid, ULID | `shared/id` only |

Choosing differently changes adapter files only. The architecture is the contract; the stack is an implementation detail.

---

## Directory Structure

```
src/
├── main.ts                          # Entry: load config → bootstrap → start
├── bootstrap/
│   ├── app.ts                       # App builder & ordered feature registration
│   └── deps.ts                      # SharedDeps container (typed)
│
├── contracts/                       # Cross-feature interfaces ONLY
│   ├── types.ts                     # Shared contract types (summaries, not entities)
│   └── [feature].ts                 # What OTHER features may call
│
├── features/
│   └── [feature]/
│       ├── feature.ts               # Factory: wires repo → service → handler
│       ├── api/
│       │   ├── [feature]Handler.ts  # Transport handlers (thin)
│       │   ├── [feature]Dto.ts      # Request/response DTOs + response mappers
│       │   └── [feature]Routes.ts   # Route registration
│       ├── app/
│       │   └── [feature]Service.ts  # Use-case orchestration
│       ├── domain/
│       │   ├── [feature].ts         # Entity (aggregate root)
│       │   ├── [feature]Command.ts  # Command types + Zod schemas
│       │   ├── interface.ts         # Ports (repository + infra capabilities)
│       │   └── e[Enum].ts           # Business enums / value objects
│       └── infra/
│           ├── [feature]Repository.ts  # Implements the domain port
│           └── [feature]Mapper.ts      # Row <-> entity, pure mapping
│
├── shared/                          # Cross-feature utilities (no business logic)
│   ├── errors/appError.ts
│   ├── context/requestContext.ts    # AsyncLocalStorage request context
│   ├── config/config.ts             # Zod-parsed env, loaded once
│   ├── logger/logger.ts             # Logger interface + default adapter
│   ├── id/id.ts                     # ID type + newID()
│   ├── time/timeutil.ts             # ALL date/time helpers
│   └── pagination/pagination.ts     # Pagination, Paginated<T>
│
├── server/
│   ├── http.ts                      # Framework instance, error handler, shutdown
│   └── middleware/                   # auth, request context, request logging
│
└── test/                            # Cross-feature integration/e2e helpers
    └── helpers/
```

Feature-level tests live inside the feature (`*.test.ts` next to the file, integration under `features/[feature]/test/`).

---

## Layer Dependency Direction

```
            api ──────► app ──────► domain ◄────── infra
             │            │            ▲              │
             └────────────┴─── shared ─┴──────────────┘

bootstrap / feature.ts may import everything (wiring only).
contracts may be imported by any feature; contracts import only shared.
```

- `domain` imports: `shared` only. Nothing else. No framework, no driver, no other feature.
- `app` imports: its own `domain`, `contracts`, `shared`.
- `infra` imports: its own `domain`, `shared`, DB/SDK drivers.
- `api` imports: its own `app` + `domain` (types), `shared`.
- A feature NEVER imports another feature's internals — only `contracts/`.

Enforce with `eslint-plugin-boundaries` or `dependency-cruiser` in CI.

---

## Domain Layer

Pure business logic. No framework dependencies. Fully unit-testable without mocks.

### Entity (aggregate root)

```ts
// features/task/domain/task.ts
import { AppError } from '@/shared/errors/appError'
import { newID, type ID } from '@/shared/id/id'

export interface TaskProps {
  id: ID
  ownerID: ID
  title: string
  done: boolean
  createdAt: Date
  updatedAt: Date
}

export class Task {
  private constructor(private props: TaskProps) {}

  // Creation: business rules + defaults + ID/timestamp generation live HERE
  static create(input: { ownerID: ID; title: string }): Task {
    const title = input.title.trim()
    if (title.length === 0) {
      throw AppError.validation('title cannot be empty', 'title')
    }
    const now = new Date()
    return new Task({
      id: newID(),
      ownerID: input.ownerID,
      title,
      done: false,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Rehydration from persistence: NO validation, NO defaults
  static fromPersistence(props: TaskProps): Task {
    return new Task(props)
  }

  // Mutations are methods that enforce invariants
  complete(): void {
    if (this.props.done) {
      throw AppError.conflict('task is already completed')
    }
    this.props.done = true
    this.touch()
  }

  rename(title: string): void {
    const trimmed = title.trim()
    if (trimmed.length === 0) {
      throw AppError.validation('title cannot be empty', 'title')
    }
    this.props.title = trimmed
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Read access via getters — no public setters
  get id(): ID { return this.props.id }
  get ownerID(): ID { return this.props.ownerID }
  get title(): string { return this.props.title }
  get done(): boolean { return this.props.done }

  // For mappers only
  toProps(): Readonly<TaskProps> {
    return { ...this.props }
  }
}
```

Rules:
- Two ways in: `create()` (validates, generates ID/timestamps) and `fromPersistence()` (trusts the store).
- State changes only through intention-revealing methods (`complete()`, `rename()`) — never by setting fields.
- If a rule spans multiple entities, put it in a domain service (`domain/[name]Service.ts`), still framework-free.

### Commands (use-case inputs)

```ts
// features/task/domain/taskCommand.ts
import { z } from 'zod'
import { idSchema } from '@/shared/id/id'

export const createTaskSchema = z.object({
  ownerID: idSchema,
  title: z.string().min(1).max(255),
})
export type CreateTaskCommand = z.infer<typeof createTaskSchema>

export const completeTaskSchema = z.object({
  taskID: idSchema,
})
export type CompleteTaskCommand = z.infer<typeof completeTaskSchema>
```

One command per use case. The schema is the single source of truth for input shape; the type is always inferred (`z.infer`), never hand-written.

### Ports (interfaces)

```ts
// features/task/domain/interface.ts
import type { ID } from '@/shared/id/id'
import type { Pagination, Paginated } from '@/shared/pagination/pagination'
import type { Task } from './task'

export interface TaskRepository {
  create(task: Task): Promise<void>
  findByID(taskID: ID): Promise<Task | null>
  findByOwner(ownerID: ID, page: Pagination): Promise<Paginated<Task>>
  update(task: Task): Promise<void>
  delete(taskID: ID): Promise<void>
}
```

Any infra capability the feature needs (mailer, file store, clock, push notifications) is declared as a port here or in `contracts/`, and implemented in `infra/`.

---

## Application Layer

Services orchestrate: validate command → check permissions → call domain → call ports → publish events. **No business rules, no defaults, no formatting.**

```ts
// features/task/app/taskService.ts
import { AppError } from '@/shared/errors/appError'
import { getContext } from '@/shared/context/requestContext'
import type { AuthorizationPort } from '@/contracts/authorization'
import type { EventBusPort } from '@/contracts/events'
import { Task } from '../domain/task'
import type { TaskRepository } from '../domain/interface'
import {
  createTaskSchema, type CreateTaskCommand,
  completeTaskSchema, type CompleteTaskCommand,
} from '../domain/taskCommand'

export interface TaskServiceDeps {
  repo: TaskRepository
  authz: AuthorizationPort
  events?: EventBusPort
}

export class TaskService {
  constructor(private deps: TaskServiceDeps) {}

  async createTask(input: CreateTaskCommand): Promise<Task> {
    const cmd = createTaskSchema.parse(input)        // 1. shape validation (runtime)
    await this.deps.authz.require('task:create')     // 2. permission
    const task = Task.create(cmd)                    // 3. domain decides
    await this.deps.repo.create(task)                // 4. persist
    await this.deps.events?.publish('task.created', { taskID: task.id }) // 5. side effects
    return task
  }

  async completeTask(input: CompleteTaskCommand): Promise<Task> {
    const cmd = completeTaskSchema.parse(input)
    await this.deps.authz.require('task:update')

    const task = await this.deps.repo.findByID(cmd.taskID)
    if (!task) throw AppError.notFound('task not found')

    const { actor } = getContext()
    if (task.ownerID !== actor.userID) throw AppError.forbidden('not your task')

    task.complete()                                  // invariant enforced in domain
    await this.deps.repo.update(task)
    return task
  }
}
```

Rules:
- Services re-parse commands with the schema even when the transport already validated — validation stays transport-independent (the same service works behind HTTP, WebSocket, a queue consumer, or a game tick).
- The ownership check above is orchestration of a *who* question; a *what/when* rule (can a done task be renamed?) belongs in the entity.
- Services return domain entities. They never build response shapes.

---

## Infrastructure Layer

Implements domain ports. Knows the driver; knows nothing about use cases.

```ts
// features/task/infra/taskRepository.ts
import type { Kysely } from 'kysely'
import type { DB } from '@/shared/db/schema'
import type { ID } from '@/shared/id/id'
import type { TaskRepository } from '../domain/interface'
import { Task } from '../domain/task'
import { taskToRow, rowToTask } from './taskMapper'

export class SqlTaskRepository implements TaskRepository {
  constructor(private db: Kysely<DB>) {}

  async create(task: Task): Promise<void> {
    await this.db.insertInto('tasks').values(taskToRow(task)).execute()
  }

  async findByID(taskID: ID): Promise<Task | null> {
    const row = await this.db
      .selectFrom('tasks')
      .selectAll()
      .where('id', '=', taskID)
      .executeTakeFirst()
    return row ? rowToTask(row) : null
  }
  // ...
}
```

```ts
// features/task/infra/taskMapper.ts — PURE field mapping.
// No conditionals, no defaults, no ID/timestamp generation, no business meaning.
import type { TaskRow } from '@/shared/db/schema'
import { Task } from '../domain/task'

export function taskToRow(task: Task): TaskRow {
  const p = task.toProps()
  return {
    id: p.id,
    owner_id: p.ownerID,
    title: p.title,
    done: p.done,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }
}

export function rowToTask(row: TaskRow): Task {
  return Task.fromPersistence({
    id: row.id,
    ownerID: row.owner_id,
    title: row.title,
    done: row.done,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}
```

Rules:
- Row types are separate from domain props (DB naming stays snake_case; domain stays camelCase).
- Sorting/filtering by user-provided field names must go through a **whitelist map** (`{ userFacingField: dbColumn }`) defined next to the repository — never interpolate user input into SQL.
- Wrap driver errors into `AppError.internal(msg, { cause })` at this boundary; driver error types never escape infra.

---

## Presentation Layer (API)

Thin transport adapters: parse request → build command → call service → map to response DTO.

```ts
// features/task/api/taskDto.ts
import type { Task } from '../domain/task'

export interface TaskResponse {
  id: string
  ownerID: string
  title: string
  done: boolean
  updatedAt: string        // ISO 8601 — dates are serialized explicitly
}

// Presentation mapping: UI shaping (date formats, display fields) is allowed here.
export function toTaskResponse(task: Task): TaskResponse {
  const p = task.toProps()
  return {
    id: p.id,
    ownerID: p.ownerID,
    title: p.title,
    done: p.done,
    updatedAt: p.updatedAt.toISOString(),
  }
}
```

```ts
// features/task/api/taskHandler.ts (Fastify example — the ONLY framework-aware file besides routes/server)
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getContext } from '@/shared/context/requestContext'
import type { TaskService } from '../app/taskService'
import { toTaskResponse } from './taskDto'

export class TaskHandler {
  constructor(private service: TaskService) {}

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const { actor } = getContext()
    const body = req.body as { title?: string }
    const task = await this.service.createTask({
      ownerID: actor.userID,
      title: body.title ?? '',
    })
    return reply.code(201).send({ data: toTaskResponse(task) })
  }
}
```

```ts
// features/task/api/taskRoutes.ts
import type { FastifyInstance } from 'fastify'
import type { TaskHandler } from './taskHandler'

export function registerTaskRoutes(app: FastifyInstance, h: TaskHandler): void {
  app.post('/tasks', h.create)
  app.get('/tasks', h.list)
  app.get('/tasks/:taskID', h.get)
  app.put('/tasks/:taskID', h.update)
  app.delete('/tasks/:taskID', h.delete)
}
```

Rules:
- Handlers never touch repositories or entities' mutation methods.
- Errors are NOT handled per-handler — they bubble to the central error handler (below).
- If the transport is not HTTP (WS messages, game commands, queue jobs), this layer is the message router; everything below it is identical.

---

## Request Context (AsyncLocalStorage)

The Node equivalent of Go's `context.Context`: per-request values available anywhere in the async call chain without threading parameters.

```ts
// shared/context/requestContext.ts
import { AsyncLocalStorage } from 'node:async_hooks'
import { AppError } from '@/shared/errors/appError'
import type { Logger } from '@/shared/logger/logger'

export interface Actor {
  userID: string
  roles: string[]
}

export interface RequestContext {
  requestID: string
  actor: Actor
  logger: Logger          // child logger tagged with requestID
  // Add app-specific fields here per project:
  // tenantID, sessionID, matchID (game), locale, ...
}

const storage = new AsyncLocalStorage<RequestContext>()

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn)
}

export function getContext(): RequestContext {
  const ctx = storage.getStore()
  if (!ctx) throw AppError.internal('no request context — middleware missing')
  return ctx
}
```

A middleware in `server/middleware/` authenticates the request, builds the context, and wraps the rest of the request in `runWithContext`. Services and repos call `getContext()` for the actor and logger. If the app is multi-tenant, the tenant goes here and a shared DB helper scopes every query with it.

---

## Error Handling

One structured error type across all layers; one place that maps it to the transport.

```ts
// shared/errors/appError.ts
export type ErrorType =
  | 'VALIDATION' | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN'
  | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL'

const STATUS: Record<ErrorType, number> = {
  VALIDATION: 400, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403,
  NOT_FOUND: 404, CONFLICT: 409, INTERNAL: 500,
}

export class AppError extends Error {
  private constructor(
    readonly type: ErrorType,
    message: string,
    readonly status: number,
    readonly field?: string,
    readonly details?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = 'AppError'
  }

  static validation(msg: string, field?: string) { return new AppError('VALIDATION', msg, STATUS.VALIDATION, field) }
  static badRequest(msg: string, cause?: unknown) { return new AppError('BAD_REQUEST', msg, STATUS.BAD_REQUEST, undefined, undefined, { cause }) }
  static unauthorized(msg = 'unauthorized') { return new AppError('UNAUTHORIZED', msg, STATUS.UNAUTHORIZED) }
  static forbidden(msg = 'forbidden') { return new AppError('FORBIDDEN', msg, STATUS.FORBIDDEN) }
  static notFound(msg: string) { return new AppError('NOT_FOUND', msg, STATUS.NOT_FOUND) }
  static conflict(msg: string) { return new AppError('CONFLICT', msg, STATUS.CONFLICT) }
  static internal(msg: string, opts?: { cause?: unknown; details?: Record<string, unknown> }) {
    return new AppError('INTERNAL', msg, STATUS.INTERNAL, undefined, opts?.details, { cause: opts?.cause })
  }
}
```

Central handler (registered once in `server/http.ts`):

```ts
app.setErrorHandler((err, req, reply) => {
  const log = getContext().logger

  if (err instanceof AppError) {
    if (err.type === 'INTERNAL') log.error({ err }, err.message)
    return reply.code(err.status).send({
      error: { type: err.type, message: err.message, field: err.field },
    })
  }
  if (err instanceof ZodError) {
    return reply.code(400).send({ error: { type: 'VALIDATION', issues: err.issues } })
  }
  log.error({ err }, 'unhandled error')
  return reply.code(500).send({ error: { type: 'INTERNAL', message: 'internal error' } })
})
```

Rules:
- Clients receive `type`, `message`, `field` — never stack traces, driver messages, or SQL.
- `cause` keeps the original error for logs (`log.error({ err })` serializes the chain).
- Don't `try/catch` in handlers or services except to *translate* (e.g., unique-constraint → `AppError.conflict`).

---

## Dependency Injection & Bootstrap

No DI framework. A typed container plus one factory per feature, registered in dependency order.

```ts
// bootstrap/deps.ts
import type { Kysely } from 'kysely'
import type { DB } from '@/shared/db/schema'
import type { Config } from '@/shared/config/config'
import type { Logger } from '@/shared/logger/logger'
import type { AuthorizationPort } from '@/contracts/authorization'
import type { TaskContract } from '@/contracts/task'

export interface SharedDeps {
  config: Config
  db: Kysely<DB>
  logger: Logger
  authz: AuthorizationPort
  // Filled in by feature factories, consumed by later features:
  taskService?: TaskContract
}
```

```ts
// features/task/feature.ts
import type { FastifyInstance } from 'fastify'
import type { SharedDeps } from '@/bootstrap/deps'
import { SqlTaskRepository } from './infra/taskRepository'
import { TaskService } from './app/taskService'
import { TaskHandler } from './api/taskHandler'
import { registerTaskRoutes } from './api/taskRoutes'

export interface Feature {
  name: string
  registerRoutes?: (app: FastifyInstance) => void
}

export function taskFeature(deps: SharedDeps): Feature {
  const repo = new SqlTaskRepository(deps.db)
  const service = new TaskService({ repo, authz: deps.authz })

  deps.taskService = service   // expose contract to later features

  const handler = new TaskHandler(service)
  return {
    name: 'task',
    registerRoutes: (app) => registerTaskRoutes(app, handler),
  }
}
```

```ts
// main.ts
const config = loadConfig()                    // Zod-parsed env — fails fast
const deps = await buildSharedDeps(config)     // db, logger, authz adapter

const features = [
  userFeature,      // order = dependency order:
  taskFeature,      // task may use deps.userService, so user comes first
  reportFeature,
].map((factory) => factory(deps))

const app = buildServer(deps)                  // framework + middleware + error handler
for (const f of features) f.registerRoutes?.(app)

await app.listen({ port: config.port })
registerGracefulShutdown([() => app.close(), () => deps.db.destroy()])
```

If a factory needs a dep that isn't set yet, that's a registration-order bug — validate at boot (assert required contracts non-null after registration) and crash with a clear message.

---

## Cross-Feature Communication

- A feature never imports another feature's internals. It depends on an interface in `contracts/`.
- Contracts expose **minimal types** (summaries/IDs), not domain entities, to keep coupling low:

```ts
// contracts/task.ts
import type { ID } from '@/shared/id/id'

export interface TaskSummary { id: ID; ownerID: ID; title: string; done: boolean }

export interface TaskContract {
  getTask(taskID: ID): Promise<TaskSummary | null>
}
```

- For fire-and-forget side effects (audit, notifications, stats), publish an event through an `EventBusPort` (contracts) with a simple in-memory adapter by default; swap for a real broker without touching features.

---

## Configuration

```ts
// shared/config/config.ts
import { z } from 'zod'

const configSchema = z.object({
  env: z.enum(['dev', 'test', 'prod']),
  port: z.coerce.number().int().positive().default(3000),
  databaseUrl: z.string().min(1),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})
export type Config = z.infer<typeof configSchema>

export function loadConfig(): Config {
  return configSchema.parse({
    env: process.env.APP_ENV,
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    logLevel: process.env.LOG_LEVEL,
  })
}
```

Rules: `process.env` is read **only** in this file, once, at boot. Everything else receives typed `Config` (or a slice of it) via deps. Missing/invalid env crashes at startup, not at first use. Document every variable in `docs/ENV.md`.

---

## Logging

- `Logger` is an interface in `shared/logger` (`debug/info/warn/error(meta, msg)`); pino is the default adapter.
- The context middleware creates a child logger per request tagged with `requestID` (and actor), stored in `RequestContext` — code logs via `getContext().logger`.
- Log structured objects, not interpolated strings. Never log credentials, tokens, or full request bodies.

---

## Testing Strategy

| Layer | Kind | Doubles | Location |
|---|---|---|---|
| domain | pure unit tests | none — it's pure | `domain/*.test.ts` |
| app | unit tests of orchestration | **hand-written fakes** implementing ports (e.g. `InMemoryTaskRepository`) — not mock libraries | `app/*.test.ts` |
| infra | integration against a real DB (Testcontainers) | none | `features/[feature]/test/` |
| api | request-level tests via `app.inject()` (no network) | fake authz as needed | `features/[feature]/test/` |

Priorities: domain rules first (every invariant has a test), then service flows (permission denied, not found, happy path), then one end-to-end happy path per feature. An in-memory fake is written once per port and reused by every service test; it lives next to the tests.

---

## TypeScript Conventions

**tsconfig (minimum):** `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"verbatimModuleSyntax": true`, ESM (`"module": "node16"` or bundler), path alias `@/* → src/*`.

**Lint (minimum):** `@typescript-eslint` recommended-type-checked, `no-floating-promises`, `no-explicit-any`, import boundaries (see dependency direction).

| Rule | Convention |
|---|---|
| ID properties | `whateverID` — `userID`, `taskID`, `ownerID` (uppercase ID suffix) |
| ID type | `ID` from `shared/id` (`newID()` generates UUID v7; `idSchema` validates) |
| Files | camelCase: `taskService.ts`, `taskMapper.ts`; entity file = feature name (`task.ts`) |
| Classes/types | PascalCase; interfaces without `I` prefix in backend code |
| Enums | `E` prefix, string-valued: `enum ETaskStatus { Open = 'open', Done = 'done' }` |
| Exports | Named exports only — no `default` |
| `any` | Forbidden. Use `unknown` at boundaries + schema parse |
| Type assertions | `as` only at transport edges (e.g. `req.body`), immediately followed by validation |
| Dates | `Date` inside domain; ISO 8601 strings in DTOs; all date math via `shared/time/timeutil` |
| Async | `async/await` only; every promise awaited or explicitly `void`-ed with a comment |
| Null vs undefined | `null` = "looked and absent" (repo results); `undefined` = "not provided" (optional inputs) |

Works standalone or as a package in a pnpm workspace; in a monorepo, DTO types and Zod schemas can be shared with the frontend via a workspace package.

---

## Adapting to Project Types

The presentation layer is the only part shaped by the product type:

| Project | Presentation layer | Domain examples | Notes |
|---|---|---|---|
| REST/SaaS API | HTTP routes + handlers (as shown) | `invoice`, `customer`, `report` | Add authz port + pagination |
| Videogame server | WS/UDP message router or tick loop dispatching **the same commands** to services | `player`, `match`, `inventory` — game rules are entity methods (`player.takeDamage()`) | Keep the tick loop free of business rules; CPU-heavy simulation in workers |
| Accounting app | HTTP + report exporters | `account`, `journalEntry`, `ledger` — double-entry invariants in the domain | Money as a value object (integer minor units), never floats |
| Worker/ETL | Queue consumers building commands | same layering | Consumers are "handlers": parse job → command → service |

In every case: commands, services, domain, and infra are identical in shape. Only the adapter that *receives input* changes.

---

## New Feature Checklist

When asked to "create feature X", produce in this order:

1. `domain/x.ts` — entity with `create()` / `fromPersistence()`, mutation methods, getters. Business rules here.
2. `domain/xCommand.ts` — one Zod schema + inferred type per use case.
3. `domain/interface.ts` — repository port (+ any capability ports).
4. `app/xService.ts` — orchestration only; parse command → authz → domain → repo → events.
5. `infra/xMapper.ts` + `infra/xRepository.ts` — row type, pure mapper, port implementation. Migration/schema change if needed.
6. `api/xDto.ts` + `api/xHandler.ts` + `api/xRoutes.ts` — thin transport.
7. `feature.ts` — factory; register in `main.ts` in dependency order; add `contracts/x.ts` only if other features need it.
8. Tests: domain invariants, service flows with an in-memory fake, one integration path.
9. Update docs (feature list, ENV.md if config was added).

Definition of done: no framework/driver import in `domain/` or `app/`; every input schema-parsed; errors via `AppError`; mapper is pure; tests pass.

---

## Data Flow Summary

```
Transport (HTTP / WS / queue / tick)
  ↓ middleware: authenticate → build RequestContext (ALS)
Handler (api/)          — parse request, build command, no logic
  ↓
Service (app/)          — schema.parse(command) → authz → orchestrate
  ↓
Entity (domain/)        — business rules, invariants, state transitions
  ↓
Repository (infra/)     — pure mapper → driver → database
  ↓
Handler maps entity → Response DTO → central error handler shapes failures
```
