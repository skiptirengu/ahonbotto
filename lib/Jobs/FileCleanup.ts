import dayjs from 'dayjs'
import { remove, readdir } from 'fs-extra'
import { inject, registry, injectable } from 'tsyringex'
import { MediaRepository } from '../Storage/MediaRepository'
import { Job } from './Job'
import { Config } from '../Config'
import { join } from 'path'
import { xor } from 'lodash'
import { Logger } from 'winston'

@injectable()
@registry([
  {
    token: 'Job',
    useClass: FileCleanup
  }
])
export class FileCleanup implements Job {
  /**
   * @inheritdoc
   */
  public interval: number

  public constructor(
    /**
     * SQLite Repository for media
     */
    @inject(MediaRepository) protected readonly media: MediaRepository,
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config,
    /**
     * Logger
     */
    @inject('Logger') protected readonly logger: Logger
  ) {
    this.interval = this.config.cleanupInverval
  }

  public async execute(): Promise<void> {
    const time = dayjs()
      .subtract(this.config.cleanupInverval, 'minute')
      .unix()

    const marked = this.media.marked(time).map(async (filename) => {
      const filepath = join(this.config.httpCacheFolder, filename)
      this.media.remove(filename)
      return remove(filepath)
    })

    await Promise.all(marked)

    const orphans = xor(this.media.all(), await readdir(this.config.httpCacheFolder)).map(
      async (filename) => {
        return remove(join(this.config.httpCacheFolder, filename))
      }
    )

    await Promise.all(orphans)

    if (marked.length > 0 || orphans.length > 0) {
      this.logger.info(
        `Deleted ${marked.length} marked file(s) and ${orphans.length} orphan file(s)`
      )
    }
  }
}
