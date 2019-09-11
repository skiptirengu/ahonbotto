export interface SearchResult {
  /**
   * Result name
   */
  name: string
  /**
   * URL of the search result
   */
  url: string
}

interface SearchResultInternal {
  /**
   * The search result itself
   */
  result: SearchResult[]
  /**
   * Timer to clear this search result
   */
  timer: NodeJS.Timeout
}

const defaultTimer = 300000

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
  public push(key: string, result: SearchResult[]): void {
    this.delete(key)
    const stored = { result, timer: setTimeout(() => this.delete(key), defaultTimer) }
    this.resultMap.set(key, stored)
  }

  /**
   * Returns the result stored on the repository on a 1-n index based
   */
  public get(key: string, index: number): SearchResult | null {
    let stored = this.resultMap.get(key)
    if (!stored) {
      return null
    }
    return stored.result[index + 1]
  }

  /**
   * Removes a key from the repository
   */
  public delete(key: string): void {
    let stored = this.resultMap.get(key)
    if (stored) {
      clearTimeout(stored.timer)
    }
    this.resultMap.delete(key)
  }
}
