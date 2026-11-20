import { describe, expect, it } from 'vitest'
import { DEFAULT_AVATAR_LOOK, EAvatarPose } from '@/contracts/avatar'
import { EComunidadID } from '@/contracts/comunidad'
import { ROUTE } from '@/contracts/route'
import { avatarSprite, EStopState, flagSprite, stopSprite } from '@/shared/pixel/sprites'
import { ETravelMode, LEGS } from '../domain/legs'
import { legMarks, legPath } from '../domain/path'
import { LEG_DURATION_MS, travelFrame } from '../domain/timeline'
import { spainLowPoly } from '../infra/spainLowPoly'
import {
  buildScene,
  clampStop,
  LAST_STOP,
  mapLabel,
  poseFor,
  routeView,
  type SceneInput,
  stopState,
  type Travel,
} from './scene'

const map = spainLowPoly()
const marks = LEGS.map((leg) => legMarks(map, leg, legPath(map, leg)))

function input(changes: Partial<SceneInput> = {}): SceneInput {
  return {
    map,
    look: DEFAULT_AVATAR_LOOK,
    at: 0,
    reached: 0,
    best: -1,
    state: 'idle',
    travel: null,
    timeMs: 0,
    ...changes,
  }
}

function travelling(legIndex: number, elapsedMs: number): Travel {
  const leg = LEGS[legIndex]
  if (leg === undefined) throw new Error(`no leg ${legIndex}`)
  return { leg, frame: travelFrame(map, leg, legPath(map, leg), elapsedMs) }
}

describe('the stops', () => {
  it('shows where she is, where she has been and what is ahead', () => {
    const scene = input({ at: 3, reached: 3 })
    expect(stopState(3, scene)).toBe(EStopState.Current)
    expect(stopState(0, scene)).toBe(EStopState.Done)
    expect(stopState(2, scene)).toBe(EStopState.Done)
    expect(stopState(4, scene)).toBe(EStopState.Ahead)
    expect(buildScene(scene).stops.map((stop) => stop.sprite)).toEqual(
      ROUTE.map((_, i) =>
        stopSprite(i === 3 ? EStopState.Current : i < 3 ? EStopState.Done : EStopState.Ahead)
      )
    )
  })

  it('while she travels, marks the stop she left as done and the next as ahead', () => {
    const scene = input({ at: 2, reached: 3, travel: travelling(2, 500) })
    expect(stopState(2, scene)).toBe(EStopState.Done)
    expect(stopState(3, scene)).toBe(EStopState.Ahead)
  })

  it('draws one landmark per stop and a flag on each checkpoint', () => {
    const scene = buildScene(input())
    expect(scene.landmarks).toHaveLength(ROUTE.length)
    expect(scene.flags.map((flag) => flag.key)).toEqual([
      `flag-${EComunidadID.Baleares}`,
      `flag-${EComunidadID.PaisVasco}`,
    ])
    expect(scene.flags[0]?.sprite).toBe(flagSprite(0))
  })

  it('marks her best stop ever, and nothing before she has one', () => {
    expect(buildScene(input()).record).toBeNull()
    const record = buildScene(input({ best: 6 })).record
    const aragon = map.anchors[EComunidadID.Aragon]
    expect(record).not.toBeNull()
    expect(record && record.x < aragon.x && record.x + record.width > aragon.x).toBe(true)
  })

  it('keeps stop numbers on the route', () => {
    expect(clampStop(-3)).toBe(0)
    expect(clampStop(40)).toBe(LAST_STOP)
    expect(clampStop(Number.NaN)).toBe(0)
  })
})

describe('her character', () => {
  it('poses by what the round is doing', () => {
    expect(poseFor('idle')).toBe(EAvatarPose.Idle)
    expect(poseFor('travelling')).toBe(EAvatarPose.Walk)
    expect(poseFor('lost')).toBe(EAvatarPose.Sad)
    expect(poseFor('won')).toBe(EAvatarPose.Cheer)
  })

  it('stands at her stop', () => {
    const scene = buildScene(input({ at: 5 }))
    const cataluna = map.anchors[EComunidadID.Cataluna]
    expect(scene.traveller.key).toBe('avatar')
    expect(scene.traveller.sprite).toBe(avatarSprite(DEFAULT_AVATAR_LOOK, EAvatarPose.Idle, 0))
    expect(scene.focus).toEqual(cataluna)
    expect(scene.traveller.y).toBeLessThan(cataluna.y)
  })

  it('takes the plane, the boat or her feet while travelling', () => {
    const plane = LEGS.findIndex((leg) => leg.mode === ETravelMode.Plane)
    expect(buildScene(input({ travel: travelling(plane, 700) })).traveller.key).toBe('plane')
    const boat = LEGS.findIndex((leg) => leg.mode === ETravelMode.Boat)
    expect(buildScene(input({ at: boat, travel: travelling(boat, 750) })).traveller.key).toBe(
      'boat'
    )
    const walk = LEGS.findIndex((leg) => leg.mode === ETravelMode.Walk)
    const scene = buildScene(input({ at: walk, travel: travelling(walk, 750) }))
    expect(scene.traveller.key).toBe('avatar')
    expect(scene.focus).not.toEqual(map.anchors[ROUTE[walk] ?? EComunidadID.Madrid])
  })

  it('celebrates with fireworks only when she wins in Madrid', () => {
    expect(buildScene(input({ at: LAST_STOP, state: 'won' })).fireworks.length).toBeGreaterThan(0)
    expect(buildScene(input({ at: LAST_STOP, state: 'idle' })).fireworks).toHaveLength(0)
    expect(buildScene(input({ at: 7, state: 'lost' })).fireworks).toHaveLength(0)
  })
})

describe('the route marks', () => {
  it('fills the legs she has travelled and leaves the rest', () => {
    const { dots } = routeView(marks, input({ at: 3, reached: 3 }))
    function byLeg(leg: number) {
      return dots.filter((dot) => dot.key.startsWith(`${leg}-`))
    }
    expect(byLeg(1).every((dot) => dot.visited)).toBe(true)
    expect(byLeg(2).every((dot) => dot.visited)).toBe(true)
    expect(byLeg(3).some((dot) => dot.visited)).toBe(false)
  })

  it('fills the leg she is on up to where she is', () => {
    const walk = LEGS.findIndex((leg, i) => i > 5 && leg.mode === ETravelMode.Walk)
    const half = routeView(
      marks,
      input({ at: walk, travel: travelling(walk, LEG_DURATION_MS / 2) })
    )
    const leg = half.dots.filter((dot) => dot.key.startsWith(`${walk}-`))
    expect(leg.some((dot) => dot.visited)).toBe(true)
    expect(leg.some((dot) => !dot.visited)).toBe(true)
  })

  it('splits a dashed crossing where the boat is', () => {
    const boat = LEGS.findIndex((leg) => leg.mode === ETravelMode.Boat)
    const view = routeView(
      marks,
      input({ at: boat, travel: travelling(boat, LEG_DURATION_MS / 2) })
    )
    const dashes = view.dashes.filter((dash) => dash.key.startsWith(`${boat}-`))
    expect(dashes.some((dash) => dash.visited)).toBe(true)
    expect(dashes.some((dash) => !dash.visited)).toBe(true)
  })
})

describe('what a screen reader hears', () => {
  it('says where she is', () => {
    expect(mapLabel(1, 'idle')).toBe('Estás en Andalucía, parada 2 de 17')
    expect(mapLabel(2, 'travelling', 3)).toBe('Viajando a C. Valenciana, parada 4 de 17')
    expect(mapLabel(6, 'lost')).toBe('Te has quedado en Aragón, parada 7 de 17')
    expect(mapLabel(16, 'won')).toBe('¡Has llegado a Madrid! Fin de la ruta, parada 17 de 17')
  })
})
