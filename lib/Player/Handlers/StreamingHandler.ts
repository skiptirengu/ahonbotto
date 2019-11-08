import { Readable } from 'stream'

import { Playable } from '../Playable'

export interface StreamingHandler {
  /**
   * Sets the streaming context
   * @param uri
   */
  setContext(playable: Playable): Promise<StreamingHandler>
  /**
   * Gets a readable stream from the context
   */
  stream(): Promise<Readable>
  /**
   * Gets the playable
   */
  getPlayable(): Playable | undefined
}
