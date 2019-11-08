import { DependencyContainer, inject, scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'

import { Playable } from '../Playable'
import { BufferedHttpStreamingHandler } from './BufferedHttpStreamingHandler'
import { LocalFileStreamingHandler } from './LocalFileStreamingHandler'
import { StreamingHandler } from './StreamingHandler'

@scoped(Lifecycle.ContainerScoped)
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
