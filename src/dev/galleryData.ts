// Example data for the component gallery: the test fixtures, plus two real
// questions so the long-text layout can be judged.

import type { DeckSummary } from '@/contracts/deck'
import { EQuestionType, ETopic, type QuestionData } from '@/contracts/question'
import { ROUTE, SAFE_RUNGS } from '@/contracts/route'
import type { LadderRung } from '@/shared/ui/types'
import { sampleQuestions } from '@/test/fixtures/questions'

export const SAMPLE_QUESTIONS: readonly QuestionData[] = sampleQuestions('dev')

export const HEAD_OF_STATE: QuestionData = {
  id: 'dev-real-1',
  topic: ETopic.Government,
  type: EQuestionType.Choice,
  question: 'Empezamos fuerte: ¿quién es el jefe del Estado en España?',
  options: ['El presidente del Gobierno', 'El rey', 'El presidente del Tribunal Constitucional'],
  answer: 1,
  explanation:
    'Según el artículo 56 de la Constitución de 1978, el rey es el jefe del Estado, símbolo de su unidad y permanencia.',
  difficulty: 1,
}

export const CORTES: QuestionData = {
  id: 'dev-real-2',
  topic: ETopic.Government,
  type: EQuestionType.Choice,
  question:
    'Según la Constitución de 1978, ¿qué órgano representa al pueblo español y ejerce la potestad legislativa del Estado?',
  options: ['El Consejo de Estado', 'Las Cortes Generales', 'El Tribunal Supremo'],
  answer: 1,
  explanation:
    'El artículo 66 dice que las Cortes Generales representan al pueblo español, están formadas por el Congreso de los Diputados y el Senado, y ejercen la potestad legislativa del Estado.',
  difficulty: 2,
}

const POINTS = [
  100, 200, 300, 500, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000,
  100000,
]

/** The ladder as the round rules will give it (gallery copy). */
export const LADDER: readonly LadderRung[] = ROUTE.map((comunidad, i) => ({
  comunidad,
  points: POINTS[i] ?? 0,
  safe: SAFE_RUNGS.includes(i + 1),
}))

export const SUMMARY: DeckSummary = {
  seen: 96,
  mastered: 61,
  total: 300,
  cycle: 1,
  roundsPlayed: 9,
  perTopic: {
    [ETopic.Government]: { seen: 40, mastered: 28, total: 100 },
    [ETopic.Rights]: { seen: 12, mastered: 9, total: 40 },
    [ETopic.Territory]: { seen: 40, mastered: 22, total: 40 },
    [ETopic.CultureHistory]: { seen: 4, mastered: 2, total: 50 },
    [ETopic.Society]: { seen: 0, mastered: 0, total: 70 },
  },
}
