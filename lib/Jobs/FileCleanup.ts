import dayjs from 'dayjs';
import { readdir, remove } from 'fs-extra';
import { xor } from 'lodash';
import { join } from 'path';
import { inject, injectable, registry } from 'tsyringe';
import { Logger } from 'winston';

import { Config } from '../Config';
import { MediaRepository } from '../Storage/MediaRepository';
import { Job } from './Job';

@injectable()
@registry([
  {
    token: 'Job',
    useClass: FileCleanup,
  },
])
export class FileCleanup implements Job {
  /**
   * @inheritdoc
   */
  public interval: number;

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
    this.interval = this.config.cleanupInverval;
  }

  public async execute(): Promise<void> {
    const time = dayjs().subtract(this.config.cleanupInverval, 'minute').unix();

    const marked = this.media.marked(time).map(async (filename) => {
      const filepath = join(this.config.httpCacheFolder, filename);
      this.media.remove(filename);
      return remove(filepath);
    });

    await Promise.all(marked);

    const allMedia = this.media.all();
    const allFiles = await readdir(this.config.httpCacheFolder);

    const orphans = xor(allMedia, allFiles).map(async (filename) => {
      return remove(join(this.config.httpCacheFolder, filename));
    });

    await Promise.all(orphans);

    if (marked.length || orphans.length) {
      this.logger.info(
        `Deleted ${marked.length} marked file(s) and ${orphans.length} orphan file(s)`,
        {
          marked: marked.length,
          orphans: orphans.length,
        }
      );
    }
  }
}
