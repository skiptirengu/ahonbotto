import { createHash } from 'crypto'
import { inject, injectable } from 'tsyringex'
import { pathExists, ensureFile } from 'fs-extra'
import { Readable, Writable } from 'stream'
import { createWriteStream, createReadStream } from 'fs'
import { join } from 'path'
import { StreamingHandler } from './StreamingHandler'
import { Config } from '../../Config'
import { UrlParser } from '../UrlParser'
import { Playable } from '../Playable'
import { MediaRepository } from '../../Storage/MediaRepository'
import miniget, { MinigetOptions } from 'miniget'
import { Guild } from 'discord.js'
import { handleStreamError } from '../../Util'

const initialBufferSize = 1 << 18
const minigetOptions: MinigetOptions = {
  highWaterMark: initialBufferSize
}

@injectable()
export class BufferedHttpStreamingHandler implements StreamingHandler {
  /**
   * Parsed playable
   */
  private playable?: Playable
  /**
   * Temp filename
   */
  private filename?: string
  /**
   * Full file path
   */
  private filepath?: string

  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config,
    /**
     * URL parser
     */
    @inject(UrlParser) protected readonly parser: UrlParser,
    /**
     * SQLite Repository for media
     */
    @inject(MediaRepository) protected readonly media: MediaRepository,
    /**
     * Current guild
     */
    @inject(Guild) protected readonly guild: Guild
  ) {}

  public async setContext(playable: Playable): Promise<StreamingHandler> {
    if (!this.playable) {
      this.playable = playable.fileUri ? playable : await this.parser.parse(playable.uri)
      this.setFilenameAndPath()
    }
    return this
  }

  public getPlayable(): Playable | undefined {
    return this.playable
  }

  public async stream(): Promise<Readable> {
    if (!this.playable) throw new Error('no context provided')

    const exists = await pathExists(this.filepath!)

    // Use local version
    if (this.media.checkAndEnable(this.filename!) && exists) {
      return this.attachCleanupEvent(await this.getReadableStream())
    }

    return this.downloadAndStream()
  }

  private async downloadAndStream(): Promise<Readable> {
    await ensureFile(this.filepath!)
    // Local buffer
    const writable = await this.getWritableStream()
    // Open the read stream
    const readable = await this.getReadableStream()
    // Destroy readable if the writer errors
    writable.once('error', (err) => readable.destroy(err))
    // Add to database
    this.media.upsert(this.filename!)
    // Mark for deletion once the readable ends
    return this.attachCleanupEvent(readable)
  }

  private attachCleanupEvent(stream: Readable): Readable {
    return stream.once(
      'close',
      handleStreamError(stream, () => {
        this.markForCleanup()
      })
    )
  }

  private markForCleanup(): void {
    this.media.markForDeletion(this.filename!)
  }

  private getWritableStream(): Promise<Writable> {
    // Download URL
    const request = miniget(this.playable!.fileUri!, minigetOptions)
    // Set status on database once complete
    request.once(
      'end',
      handleStreamError(request, () => {
        this.media.complete(this.filename!)
      })
    )
    // Buffer the file locally
    const stream = request.pipe(createWriteStream(this.filepath!))
    // Pipe all errors to write stream
    request.once('error', (err) => stream.destroy(err))

    return new Promise((resolve) => {
      let written = 0
      // Wait the buffer to grow to a considerable size
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const stream = createReadStream(this.filepath!, { emitClose: true })
    return new Promise((resolve) => {
      stream.once('readable', () => resolve(stream))
    })
  }

  private setFilenameAndPath(): void {
    const name = `${this.guild.id}-${this.playable!.uri}`

    this.filename = createHash('sha256')
      .update(name)
      .digest('hex')

    this.filepath = join(this.config.httpCacheFolder, this.filename)
  }
}
