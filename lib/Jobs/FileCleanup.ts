import dayjs from 'dayjs'
import { remove } from 'fs-extra'
import { inject, registry, injectable } from 'tsyringex'
import { MediaRepository } from '../Storage/MediaRepository'
import { Job } from './Job'
import { Config } from '../Config'
import { join } from 'path'

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
    @inject('Config') protected readonly config: Config
  ) {
    this.interval = this.config.cleanupInverval
  }

  public async execute(): Promise<void> {
    const time = dayjs()
      .subtract(this.config.cleanupInverval, 'minute')
      .unix()

    const promises = this.media.marked(time).map(async (filename) => {
      const filepath = join(this.config.httpCacheFolder, filename)
      await remove(filepath)
      this.media.remove(filename)
    })

    await Promise.all(promises)
  }
}
