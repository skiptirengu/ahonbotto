import { Playable } from './Playable'
import { Message } from 'discord.js'
import { scoped } from 'tsyringex'

interface SearchResultInternal {
  /**
   * The search result itself
   */
  result: Playable[]
  /**
   * Timer to clear this search result
   */
  timer: NodeJS.Timeout
}

const defaultTimer = 300000

@scoped()
export class SearchRepository {
  public constructor(
    /**
     *
     */
    protected readonly resultMap: Map<string, SearchResultInternal> = new Map()
  ) {}

  /**
   * Pushes a value to the repository
   */
  public push(key: string, result: Playable[]): void {
    this.delete(key)
    const stored = { result, timer: setTimeout(() => this.delete(key), defaultTimer) }
    this.resultMap.set(key, stored)
  }

  /**
   * Returns how many itens are stored for a the given key
   */
  public size(key: string): number {
    const stored = this.resultMap.get(key)
    if (!stored) {
      return 0
    }
    return stored.result.length
  }

  /**
   * Returns the result stored on the repository on a 1-n index based
   */
  public get(key: string, index: number): Playable | null {
    const stored = this.resultMap.get(key)
    if (!stored) {
      return null
    }
    return stored.result[index - 1]
  }

  /**
   * Removes a key from the repository
   */
  public delete(key: string): void {
    const stored = this.resultMap.get(key)
    if (stored) {
      clearTimeout(stored.timer)
    }
    this.resultMap.delete(key)
  }

  public buildKey(message: Message): string {
    return `Guild:${message.guild!.id}|User:${message.author!.id}`
  }
}
