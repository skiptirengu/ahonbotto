import { StreamingHandler } from './StreamingHandler'
import { BufferedHttpStreamingHandler } from './BufferedHttpStreamingHandler'
import { LocalFileStreamingHandler } from './LocalFileStreamingHandler'
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
  public async create(playable: Playable): Promise<StreamingHandler> {
    switch (playable.uri.protocol.replace(':', '')) {
      case 'http':
      case 'https':
        return this.container.resolve(BufferedHttpStreamingHandler).setContext(playable)
      case 'file':
        return this.container.resolve(LocalFileStreamingHandler).setContext(playable)
      default:
        throw new Error(`unknown scheme ${playable.uri.protocol}`)
    }
  }
}
