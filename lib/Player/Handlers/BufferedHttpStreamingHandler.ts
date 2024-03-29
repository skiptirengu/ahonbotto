import { StreamType } from '@discordjs/voice';
import { createHash } from 'crypto';
import { Guild } from 'discord.js';
import { ensureFile, pathExists } from 'fs-extra';
import { createReadStream, createWriteStream } from 'fs-extra';
import miniget, { Options } from 'miniget';
import { join } from 'path';
import { Readable, Writable } from 'stream';
import { inject, injectable } from 'tsyringe';

import { Config } from '../../Config';
import { TOKENS } from '../../Container/tokens';
import { MediaRepository } from '../../Storage/MediaRepository';
import { anyOnce, handleStreamError } from '../../Util';
import { AutoParser } from '../Parser/AutoParser';
import { Playable } from '../Playable';
import { StreamingHandler } from './StreamingHandler';

const initialBufferSize = 1 << 18;
const minigetOptions: Options = {
  highWaterMark: initialBufferSize,
};

@injectable()
export class BufferedHttpStreamingHandler implements StreamingHandler {
  /**
   * Parsed playable
   */
  private playable?: Playable;
  /**
   * Temp filename
   */
  private filename?: string;
  /**
   * Full file path
   */
  private filepath?: string;

  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config,
    /**
     * URL parser
     */
    @inject(AutoParser) protected readonly parser: AutoParser,
    /**
     * SQLite Repository for media
     */
    @inject(MediaRepository) protected readonly media: MediaRepository,
    /**
     * Current guild
     */
    @inject(TOKENS.Guild) protected readonly guild: Guild
  ) {}

  public async setContext(playable: Playable): Promise<StreamingHandler> {
    if (this.playable) return this;

    this.playable = !playable.fileUri
      ? ((await this.parser.parse(playable.uri.href, true)) as Playable)
      : playable;

    if (!this.playable.streamType) {
      this.playable.streamType = StreamType.Arbitrary;
    }

    this.setFilenameAndPath();
    return this;
  }

  public getPlayable(): Playable | undefined {
    return this.playable;
  }

  public async stream(): Promise<Readable> {
    if (!this.playable) throw new Error('no context provided');

    const exists = await pathExists(this.filepath!);

    // Use local version
    if (this.media.checkAndEnable(this.filename!) && exists) {
      return this.attachCleanupEvent(await this.getReadableStream());
    }

    return this.downloadAndStream();
  }

  private async downloadAndStream(): Promise<Readable> {
    await ensureFile(this.filepath!);
    // Local buffer
    const writable = await this.getWritableStream();
    // Open the read stream
    const readable = await this.getReadableStream();
    // Destroy readable if the writer errors
    writable.once('error', (err) => readable.destroy(err));
    // Mark for deletion once the readable ends
    return this.attachCleanupEvent(readable);
  }

  private attachCleanupEvent(stream: Readable): Readable {
    return anyOnce(stream, ['close', 'end', 'error'], () => this.markForCleanup());
  }

  private markForCleanup(): void {
    this.media.markForDeletion(this.filename!);
  }

  private async getWritableStream(): Promise<Writable> {
    // Download URL
    const request = miniget(this.playable!.fileUri!.href, minigetOptions)!;
    // Add to database
    this.media.upsert(this.filename!);
    // Set status on database once complete
    request.once(
      'end',
      handleStreamError(request, () => {
        this.media.complete(this.filename!);
      })
    );
    // Buffer the file locally
    const stream = request.pipe(createWriteStream(this.filepath!));
    // Pipe all errors to write stream
    request.once('error', (err: any) => stream.destroy(err));

    return new Promise((resolve) => {
      // Wait for the response
      request.once('response', (res: any) => {
        const length = parseInt(res.headers['content-length'], 10);
        // Wait the buffer to grow to a considerable size
        let written = 0;
        request.on('data', function onData(chunk: Buffer) {
          written += chunk.length;
          // Only resolve when we got enough data
          if (written >= initialBufferSize || written >= length) {
            request.removeListener('data', onData);
            resolve(stream);
          }
        });
      });
    });
  }

  private async getReadableStream(): Promise<Readable> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const stream = createReadStream(this.filepath!, { emitClose: true });
    return new Promise((resolve) => {
      stream.once('readable', () => resolve(stream));
    });
  }

  private setFilenameAndPath(): void {
    const name = `${this.guild.id}-${this.playable!.uri}`;

    this.filename = createHash('sha256').update(name).digest('hex');

    this.filepath = join(this.config.httpCacheFolder, this.filename);
  }
}
