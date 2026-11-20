// How numbers and labels read on screen, in Spanish. Presentation only.

import { COMUNIDADES } from '@/contracts/comunidad'
import { ETopic, TOPICS } from '@/contracts/question'
import { ROUND_LENGTH, ROUTE } from '@/contracts/route'
import { ELadderStatus, ERungState } from './types'

const NBSP = ' '

/** Points with a dot every three digits, always: 100, 1.000, 100.000. */
export function formatPoints(points: number): string {
  const digits = String(Math.round(Math.abs(points)))
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return points < 0 ? `-${grouped}` : grouped
}

/** A percentage the Spanish way, with a non-breaking space: "62 %". */
export function formatPercent(value: number): string {
  return `${Math.round(value)}${NBSP}%`
}

/** The letter of an option: 0 → A, 1 → B, 2 → C. */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

const SHORT_TOPIC_TITLES: Readonly<Record<ETopic, string>> = {
  [ETopic.Government]: 'Gobierno y participación',
  [ETopic.Rights]: 'Derechos y deberes',
  [ETopic.Territory]: 'Territorio y geografía',
  [ETopic.CultureHistory]: 'Cultura e historia',
  [ETopic.Society]: 'Sociedad',
}

export interface TopicLabel {
  readonly number: number
  /** The exam's name for the tarea. */
  readonly title: string
  /** A short name that fits a chip. */
  readonly short: string
}

/** A tarea's number and names. */
export function topicLabel(topic: ETopic): TopicLabel {
  const info = TOPICS.find((t) => t.topic === topic)
  return {
    number: info?.number ?? 0,
    title: info?.title ?? '',
    short: SHORT_TOPIC_TITLES[topic],
  }
}

/** "Parada 3 de 17". */
export function stopLabel(rung: number): string {
  return `Parada ${rung} de ${ROUND_LENGTH}`
}

/** The short name of rung n's comunidad (1-based), or '' outside the route. */
export function rungComunidadName(rung: number): string {
  const comunidad = ROUTE[rung - 1]
  return comunidad === undefined ? '' : COMUNIDADES[comunidad].shortName
}

/** How rung `rung` looks when she is on rung `current` (1-based) and the round is `status`. */
export function rungState(rung: number, current: number, status: ELadderStatus): ERungState {
  if (status === ELadderStatus.Won) return ERungState.Done
  if (rung < current) return ERungState.Done
  if (rung > current) return ERungState.Ahead
  if (status === ELadderStatus.Lost) return ERungState.Failed
  if (status === ELadderStatus.Stopped) return ERungState.Ahead
  return ERungState.Current
}
