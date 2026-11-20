// Test helpers for the stores and screens: the real deps container on
// in-memory storage, the fake question catalog, seeded randomness and a
// sound player that records instead of playing.

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, type Pinia } from 'pinia'
import { createApp, defineComponent, type Component } from 'vue'
import { createMemoryHistory, type Router } from 'vue-router'
import { EMode, type QuestionData } from '@/contracts/question'
import { MemoryLogger } from '@/shared/logger/logger'
import { SeededRandom } from '@/shared/random/random'
import type { SoundPlayer } from '@/shared/sound/soundPlayer'
import type { ESound } from '@/shared/sound/sounds'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import { FakeCatalog, sampleQuestions } from '@/test/fixtures/questions'
import { createDeps, provideDeps, type AppDeps, type DepsOptions } from '../deps'
import { createAppRouter } from '../router'

/** Remembers what would have played. */
export class RecordingSound implements SoundPlayer {
  readonly played: ESound[] = []
  muted = false

  play(sound: ESound): void {
    if (!this.muted) this.played.push(sound)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }
}

export interface TestDeps extends AppDeps {
  readonly store: MemoryStore
  readonly recorded: RecordingSound
  readonly logs: MemoryLogger
  /** The game set's questions, to look up right answers. */
  readonly questions: readonly QuestionData[]
}

export interface TestDepsOptions extends Omit<DepsOptions, 'store' | 'sound' | 'log'> {
  /** Adds an official set with its own sample questions. Default: true. */
  readonly official?: boolean
  /** Her name and the welcome done. Default: true. */
  readonly welcomed?: boolean
}

/** The real container on memory storage, with the fake catalog (20 sample questions per set). */
export function testDeps(options: TestDepsOptions = {}): TestDeps {
  const store = new MemoryStore()
  const recorded = new RecordingSound()
  const logs = new MemoryLogger()
  const questions = sampleQuestions('g')
  const catalog =
    options.catalog ??
    new FakeCatalog([
      { setID: 'game', mode: EMode.Game, questions },
      ...((options.official ?? true)
        ? [
            {
              setID: 'official-2026',
              mode: EMode.Official,
              edition: 2026,
              questions: sampleQuestions('o'),
            },
          ]
        : []),
    ])
  const deps = createDeps({
    ...options,
    catalog,
    store,
    sound: recorded,
    log: logs,
    random: options.random ?? (() => new SeededRandom(17)),
  })
  if (options.welcomed ?? true) {
    deps.settings.rename('Lucía')
    deps.settings.finishWelcome()
  }
  return { ...deps, store, recorded, logs, questions }
}

/** A Pinia with the deps provided, for testing a store without a component. */
export function storePinia(deps: AppDeps): Pinia {
  const app = createApp(defineComponent({ render: () => null }))
  const pinia = createPinia()
  app.use(pinia)
  provideDeps(app, deps)
  return pinia
}

export interface MountedScreen {
  readonly wrapper: VueWrapper
  readonly router: Router
  readonly pinia: Pinia
}

export interface MountScreenOptions {
  /** Where the router starts. Default: Home. */
  readonly path?: string
  readonly props?: Record<string, unknown>
  readonly stubs?: Record<string, Component | boolean>
}

/** Mounts a screen with the deps, a fresh Pinia and the app's router (memory history) at `path`. */
export async function mountScreen(
  component: Component,
  deps: AppDeps,
  options: MountScreenOptions = {}
): Promise<MountedScreen> {
  const pinia = createPinia()
  const router = createAppRouter({ history: createMemoryHistory() })
  await router.push(options.path ?? '/')
  await router.isReady()
  const wrapper = mount(component, {
    props: options.props,
    attachTo: document.body,
    global: {
      plugins: [pinia, router, { install: (app) => provideDeps(app, deps) }],
      stubs: options.stubs ?? {},
    },
  })
  await flushPromises()
  return { wrapper, router, pinia }
}

/** The right option of the question the round is asking. */
export function rightAnswer(deps: TestDeps): number {
  const questionID = deps.rounds.state()?.question?.questionID
  const question = deps.questions.find((q) => q.id === questionID)
  if (question === undefined) throw new Error('no game question is being asked')
  return question.answer
}

/** A wrong option of the question the round is asking. */
export function wrongAnswer(deps: TestDeps): number {
  return rightAnswer(deps) === 0 ? 1 : 0
}
