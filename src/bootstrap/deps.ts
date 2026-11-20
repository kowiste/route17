// The one deps container: every service the screens use, built once and
// provided to the app. Each feature's Pinia store injects its own slice
// (the keys live next to the stores), so no feature imports bootstrap.

import type { App } from 'vue'
import type { IQuestionCatalog } from '@/contracts/catalog'
import type { IDeck } from '@/contracts/deck'
import type { AvatarService } from '@/features/avatar/app/avatarService'
import { createAvatarService } from '@/features/avatar/feature'
import { AVATAR_STORE_DEPS } from '@/features/avatar/view/avatarStore'
import { HomeService } from '@/features/home/app/homeService'
import { HOME_STORE_DEPS } from '@/features/home/view/homeStore'
import { ProgressService } from '@/features/progress/app/progressService'
import { ProgressRepository } from '@/features/progress/infra/progressRepository'
import { PROGRESS_STORE_DEPS } from '@/features/progress/view/progressStore'
import { QuestionCatalog } from '@/features/questions/app/questionCatalog'
import { GlobQuestionSetSource } from '@/features/questions/infra/questionFileLoader'
import { RoundService } from '@/features/round/app/roundService'
import type { IRoundRecords } from '@/features/round/domain/interface'
import { KeyValueRoundRecords } from '@/features/round/infra/roundRecords'
import { ROUND_STORE_DEPS } from '@/features/round/view/roundStore'
import type { SettingsService } from '@/features/settings/app/settingsService'
import { createSettingsService } from '@/features/settings/feature'
import { SETTINGS_STORE_DEPS } from '@/features/settings/view/settingsStore'
import { logger as defaultLogger, type Logger } from '@/shared/logger/logger'
import { newRandom, type Random } from '@/shared/random/random'
import { sound as defaultSound, type SoundPlayer } from '@/shared/sound/soundPlayer'
import { browserStore, type KeyValueStore } from '@/shared/storage/keyValueStore'

export interface AppDeps {
  readonly catalog: IQuestionCatalog
  /** Her progress per set: which questions she gets. */
  readonly deck: IDeck
  readonly records: IRoundRecords
  readonly rounds: RoundService
  readonly home: HomeService
  readonly avatar: AvatarService
  readonly settings: SettingsService
  readonly sound: SoundPlayer
  readonly log: Logger
}

/** What a test (or another host) can swap; everything else is built from these. */
export interface DepsOptions {
  /** Where progress, records, the avatar and the settings are saved. Default: the browser's. */
  readonly store?: KeyValueStore
  /** The question sets. Default: the files under `questions/`. */
  readonly catalog?: IQuestionCatalog
  /** Her decks. Default: the progress feature's, on `store`. */
  readonly deck?: IDeck
  /** Makes the `Random` of each part (deck shuffles, each round): fresh seeds by default. */
  readonly random?: () => Random
  readonly sound?: SoundPlayer
  readonly log?: Logger
}

export function createDeps(options: DepsOptions = {}): AppDeps {
  const store = options.store ?? browserStore()
  const log = options.log ?? defaultLogger
  const random = options.random ?? newRandom
  const catalog = options.catalog ?? new QuestionCatalog(new GlobQuestionSetSource())
  const deck =
    options.deck ??
    new ProgressService({
      catalog,
      repository: new ProgressRepository(store, log),
      random: random(),
    })
  const records = new KeyValueRoundRecords(store, log)
  return {
    catalog,
    deck,
    records,
    rounds: new RoundService({ catalog, deck, records, random }),
    home: new HomeService({ catalog, deck, records }),
    avatar: createAvatarService(store, log),
    settings: createSettingsService(store, log),
    sound: options.sound ?? defaultSound,
    log,
  }
}

/** Gives each feature's store its slice of the container. */
export function provideDeps(app: App, deps: AppDeps): void {
  app.provide(SETTINGS_STORE_DEPS, { settings: deps.settings, sound: deps.sound })
  app.provide(AVATAR_STORE_DEPS, { avatar: deps.avatar })
  app.provide(HOME_STORE_DEPS, { home: deps.home })
  app.provide(PROGRESS_STORE_DEPS, { catalog: deps.catalog, deck: deps.deck })
  app.provide(ROUND_STORE_DEPS, { rounds: deps.rounds, sound: deps.sound })
}
