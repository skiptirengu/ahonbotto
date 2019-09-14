import { StreamingHandler } from './StreamingHandler'
import { parse } from 'uri-js'
import { BufferedHttpStreamingHandler } from './BufferedHttpStreamingHandler'
import { DependencyContainer, scoped, inject } from 'tsyringex'
import { Playable } from '../Playable'

@scoped()
export class HandlerFactory {
  public constructor(
    /**
     * Scoped dependency container
     */
    @inject('Container') protected readonly container: DependencyContainer
  ) {}

  /**
   * Returns an appropriate StreamingHandler for the given URI
   */
  public create(playable: Playable): Promise<StreamingHandler> {
    const uri = parse(playable.uri)

    if (!uri.scheme || !['http', 'https'].includes(uri.scheme)) {
      throw new Error(`unknown scheme ${uri.scheme}`)
    }

    return this.container.resolve(BufferedHttpStreamingHandler).setContext(playable)
  }
}
