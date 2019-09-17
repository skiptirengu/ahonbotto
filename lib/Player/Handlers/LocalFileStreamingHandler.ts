import { StreamingHandler } from './StreamingHandler'
import { injectable } from 'tsyringex'
import { Playable } from '../Playable'
import { Readable } from 'stream'
import { createReadStream } from 'fs-extra'

@injectable()
export class LocalFileStreamingHandler implements StreamingHandler {
  /**
   * Parsed playable
   */
  private playable?: Playable

  public setContext(playable: Playable): Promise<StreamingHandler> {
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
