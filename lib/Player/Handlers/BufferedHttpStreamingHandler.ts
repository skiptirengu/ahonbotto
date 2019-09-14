import { randomBytes } from 'crypto'
import { inject, autoInjectable } from 'tsyringex'
import { ensureFile } from 'fs-extra'
import { Readable, Writable } from 'stream'
import { createWriteStream, createReadStream } from 'fs'
import { join } from 'path'
import { StreamingHandler } from './StreamingHandler'
import { Config } from '../../Config'
import { UrlParser } from '../UrlParser'
import { Playable } from '../Playable'
import miniget, { MinigetOptions } from 'miniget'

const cacheFolder = 'http-cache'
const initialBufferSize = 1 << 18
const minigetOptions: MinigetOptions = {
  highWaterMark: initialBufferSize
}

@autoInjectable()
export class BufferedHttpStreamingHandler implements StreamingHandler {
  /**
   * Parsed playable
   */
  private playable?: Playable
  /**
   * Temp filename
   */
  private filename?: string

  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config?: Config,
    /**
     * URL parser
     */
    @inject(UrlParser) protected readonly parser?: UrlParser
  ) {}

  public async setContext(uri: string): Promise<StreamingHandler> {
    if (!this.playable) {
      this.playable = await this.parser!.parse(uri)
      this.filename = this.newFile()
      await ensureFile(this.filename)
    }
    return this
  }

  public async stream(): Promise<Readable> {
    if (!this.playable) throw new Error('no context provided')
    // Local buffer
    const writable = await this.getWritableStream()
    // Open the read stream
    const readable = await this.getReadableStream()
    // Destroy readable if the writer errors
    writable.once('error', (err) => {
      console.log('Writable received error', err)
      readable.destroy(err)
    })
    readable.on('error', (err) => {
      console.log('Readable received error', err)
    })
    // Mark for deletion once the readable ends
    return readable.once('end', () => this.markForCleanup())
  }

  private markForCleanup(): void {
    console.log(this.filename!)
  }

  private getWritableStream(): Promise<Writable> {
    // Download URL
    const request = miniget(this.playable!.uri, minigetOptions)
    // Buffer the file locally
    const stream = request.pipe(createWriteStream(this.filename!))

    return new Promise((resolve) => {
      let written = 0
      // Wait the buffer to grow a considerable size
      request.on('data', function onData(chunk: Buffer) {
        written += chunk.length
        // Only resolve when we got enough data
        if (written >= initialBufferSize) {
          request.removeListener('data', onData)
          resolve(stream)
        }
      })
    })
  }

  private getReadableStream(): Promise<Readable> {
    const stream = createReadStream(this.filename!)
    return new Promise((resolve) => {
      stream.once('readable', () => resolve(stream))
    })
  }

  private newFile(): string {
    const name = randomBytes(16).toString('hex')
    return join(this.config!.runtimeFolder, cacheFolder, name)
  }
}
