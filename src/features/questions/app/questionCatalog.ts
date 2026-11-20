// The question catalog other features use (`IQuestionCatalog`). It loads the
// sets once, on first use, and keeps them; a load that fails is tried again on
// the next call.

import type { IQuestionCatalog, QuestionSetSummary } from '@/contracts/catalog'
import type { EMode, QuestionData, QuestionID, QuestionRef, SetID } from '@/contracts/question'
import type { IQuestionSetSource } from '../domain/interface'
import { QuestionLibrary } from '../domain/questionLibrary'

export class QuestionCatalog implements IQuestionCatalog {
  private loading: Promise<QuestionLibrary> | null = null

  constructor(private readonly source: IQuestionSetSource) {}

  async sets(): Promise<readonly QuestionSetSummary[]> {
    return (await this.library()).sets().map((set) => set.summary())
  }

  async newestSet(mode: EMode): Promise<QuestionSetSummary | null> {
    return (await this.library()).newest(mode)?.summary() ?? null
  }

  async index(setID: SetID): Promise<readonly QuestionRef[]> {
    return (await this.library()).get(setID).refs()
  }

  async questions(setID: SetID, ids: readonly QuestionID[]): Promise<readonly QuestionData[]> {
    return (await this.library()).get(setID).pick(ids)
  }

  private async library(): Promise<QuestionLibrary> {
    this.loading ??= this.source.load().then((folders) => QuestionLibrary.create(folders))
    const attempt = this.loading
    try {
      return await attempt
    } catch (error) {
      if (this.loading === attempt) this.loading = null
      throw error
    }
  }
}
