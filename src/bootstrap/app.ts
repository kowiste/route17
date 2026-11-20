// Builds the app: Pinia, the deps container provided to the stores, her
// settings applied to the page, and the router that sends her to the welcome
// until she has a name and a character.

import { createPinia, type Pinia } from 'pinia'
import { createApp, type App as VueApp } from 'vue'
import type { Router, RouterHistory } from 'vue-router'
import App from '@/App.vue'
import { useSettingsStore } from '@/features/settings/view/settingsStore'
import type { AppDeps } from './deps'
import { provideDeps } from './deps'
import { createAppRouter } from './router'

export interface Route17App {
  readonly app: VueApp
  readonly router: Router
  readonly pinia: Pinia
}

export function createRoute17App(
  deps: AppDeps,
  options: { history?: RouterHistory } = {}
): Route17App {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  provideDeps(app, deps)

  const settings = useSettingsStore(pinia)
  settings.apply()

  const router = createAppRouter({
    history: options.history,
    needsWelcome: () => !settings.settings.welcomed,
  })
  app.use(router)

  app.config.errorHandler = (error, _instance, info) => {
    deps.log.error('unexpected error', { error: String(error), info })
  }
  return { app, router, pinia }
}
