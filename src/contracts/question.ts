// What every feature knows about a question. The question files under
// `questions/` are parsed into these types by the questions feature.

/** A question's ID, unique within its set: `g-t1-001` (game), `o26-1001` (official 2026). */
export type QuestionID = string

/** A question set's ID: the name of its folder under `questions/` (`game`, `official-2026`). */
export type SetID = string

/** The five parts (tareas) of the CCSE exam. */
export enum ETopic {
  Government = 'gobierno',
  Rights = 'derechos',
  Territory = 'territorio',
  CultureHistory = 'cultura-historia',
  Society = 'sociedad',
}

/** The tareas in exam order, with their number and their name on screen. */
export const TOPICS: readonly {
  readonly topic: ETopic
  readonly number: number
  readonly title: string
}[] = [
  { topic: ETopic.Government, number: 1, title: 'Gobierno, legislación y participación ciudadana' },
  { topic: ETopic.Rights, number: 2, title: 'Derechos y deberes fundamentales' },
  {
    topic: ETopic.Territory,
    number: 3,
    title: 'Organización territorial de España. Geografía física y política',
  },
  { topic: ETopic.CultureHistory, number: 4, title: 'Cultura e historia de España' },
  { topic: ETopic.Society, number: 5, title: 'Sociedad española' },
]

export enum EQuestionType {
  /** Three options, one right. */
  Choice = 'choice',
  /** Exactly the options "Verdadero" and "Falso". */
  TrueFalse = 'trueFalse',
}

/** The options of every true/false question, in this order. */
export const TRUE_FALSE_OPTIONS: readonly string[] = ['Verdadero', 'Falso']

/** The two modes; they play the same, only the question set changes. */
export enum EMode {
  /** The Instituto Cervantes manual's questions, word for word. */
  Official = 'official',
  /** Our own questions on the same topics. */
  Game = 'game',
}

/** 1 easy, 2 medium, 3 hard. */
export type Difficulty = 1 | 2 | 3

export interface QuestionData {
  readonly id: QuestionID
  readonly topic: ETopic
  readonly type: EQuestionType
  readonly question: string
  readonly options: readonly string[]
  /** Index into `options` of the right answer. */
  readonly answer: number
  /** Why the answer is right, in Spanish: shown behind the ⓘ after answering. */
  readonly explanation: string
  readonly difficulty: Difficulty
}

/** The minimum the deck needs to know about each question of a set. */
export interface QuestionRef {
  readonly id: QuestionID
  readonly topic: ETopic
  readonly difficulty: Difficulty
}
