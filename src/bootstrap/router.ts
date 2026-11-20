import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
  type Router,
  type RouterHistory,
} from 'vue-router'
import { EMode } from '@/contracts/question'

// Hash history (`/#/jugar/game`): works on any static host with no server config.

export enum ERouteName {
  Welcome = 'welcome',
  Home = 'home',
  Round = 'round',
  Result = 'result',
  Progress = 'progress',
  Settings = 'settings',
  Dev = 'dev',
}

function appRoutes(): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [
    {
      path: '/',
      name: ERouteName.Home,
      component: () => import('@/screens/HomeScreen.vue'),
    },
    {
      path: '/bienvenida',
      name: ERouteName.Welcome,
      component: () => import('@/screens/WelcomeScreen.vue'),
    },
    {
      path: '/jugar/:mode(official|game)',
      name: ERouteName.Round,
      component: () => import('@/screens/RoundScreen.vue'),
      props: true,
    },
    {
      path: '/resultado',
      name: ERouteName.Result,
      component: () => import('@/screens/ResultScreen.vue'),
    },
    {
      path: '/progreso',
      name: ERouteName.Progress,
      component: () => import('@/screens/ProgressScreen.vue'),
    },
    {
      path: '/ajustes',
      name: ERouteName.Settings,
      component: () => import('@/screens/SettingsScreen.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ]

  // The component gallery exists only in development builds.
  if (import.meta.env.DEV) {
    routes.push({
      path: '/dev',
      name: ERouteName.Dev,
      component: () => import('@/dev/DevGallery.vue'),
    })
  }
  return routes
}

export interface AppRouterOptions {
  /** Default: hash history; tests pass a memory history. */
  readonly history?: RouterHistory
  /** True until she has gone through the welcome: every screen sends her there first. */
  readonly needsWelcome?: () => boolean
}

export function createAppRouter(options: AppRouterOptions = {}): Router {
  const router = createRouter({
    history: options.history ?? createWebHashHistory(),
    routes: appRoutes(),
    scrollBehavior: () => ({ top: 0 }),
  })
  const needsWelcome = options.needsWelcome ?? (() => false)
  router.beforeEach((to) => {
    if (to.name === ERouteName.Dev) return true
    const welcome = needsWelcome()
    if (welcome && to.name !== ERouteName.Welcome) return { name: ERouteName.Welcome }
    if (!welcome && to.name === ERouteName.Welcome) return { name: ERouteName.Home }
    return true
  })
  return router
}

/** The route of a round. */
export function roundRoute(mode: EMode): { name: ERouteName; params: { mode: EMode } } {
  return { name: ERouteName.Round, params: { mode } }
}

/** A route param as a mode; null when it isn't one. */
export function modeParam(value: unknown): EMode | null {
  return value === EMode.Official || value === EMode.Game ? value : null
}
