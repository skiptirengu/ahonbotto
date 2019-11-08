import { createReadStream } from 'fs-extra'
import { Readable } from 'stream'
import { injectable } from 'tsyringe'

import { Playable } from '../Playable'
import { StreamingHandler } from './StreamingHandler'

@injectable()
export class LocalFileStreamingHandler implements StreamingHandler {
  /**
   * Parsed playable
   */
  private playable?: Playable

  public async setContext(playable: Playable): Promise<StreamingHandler> {
    this.playable = playable
    this.playable.fileUri = this.playable.uri
    this.playable.isLocal = true
    this.playable.streamType = 'webm/opus'
    return Promise.resolve(this)
  }

  public async stream(): Promise<Readable> {
    return createReadStream(this.playable!.fileUri!)
  }

  public getPlayable(): Playable | undefined {
    return this.playable
  }
}
