import appRoot from 'app-root-path';
import { config, DotenvConfigOutput } from 'dotenv-override-true';
import { watch } from 'fs-extra';
import { ensureDirSync } from 'fs-extra';
import _ from 'lodash';
import { join } from 'path';
import { DependencyContainer } from 'tsyringe';
import { Logger } from 'winston';

import { Config } from './Config';

export class Env {
  /**
   * Result from loading .env file
   */
  private static envResult: DotenvConfigOutput | null = null;
  /**
   * .env file path
   */
  private static envFilePath = join(appRoot.path, '.env');
  /**
   * Current config
   */
  private static config: Config;

  /**
   * Bootstraps the enviroment file
   */
  public static bootstrap(container: DependencyContainer, loggerFactory: () => Logger): void {
    if (Env.envResult !== null) {
      return;
    }

    Env.envResult = config({ path: Env.envFilePath });
    Env.buildConfig();
    container.register('Config', { useFactory: () => Env.config });
    const logger = loggerFactory();
    logger.info('initialization completed using configuration', Env.getConfigLog());

    if (!Env.envResult.error) {
      watch(Env.envFilePath, () => Env.reload(logger));
    }
  }

  private static reload(logger: Logger): void {
    config({ path: Env.envFilePath });
    Env.buildConfig();
    logger.info('.env changed - reloaded config', Env.getConfigLog());
  }

  private static getConfigLog(): any {
    const config = Env.config;
    return _.omit(config, ['discordToken', 'youtubeToken']);
  }

  private static buildConfig(): void {
    const runtimeFolder = join(appRoot.path, 'runtime');
    const resourcesFolder = 'resources';
    const cacheFolder = 'http-cache';

    const prod = process.env['NODE_ENV'] === 'production';
    const prefixes = process.env['COMMAND_PREFIXES'] as string;
    const logTargets = process.env['LOG_TARGETS'] as string;
    const markovProb = ((process.env['MARKOV_PROBABILITY_INCREASE'] || '') as string)
      .split(',')
      .filter((x) => x);

    // build config object
    Env.config = {
      discordToken: process.env['DISCORD_TOKEN'] as string,
      youtubeToken: process.env['YOUTUBE_TOKEN'] as string,
      commandPrefixes: _.split(prefixes, ',') || ['!'],
      runtimeFolder: runtimeFolder,
      embedColor: 0x1882ac,
      cleanupInverval: 10,
      httpCacheFolder: join(runtimeFolder, cacheFolder),
      resourcesFolder: join(appRoot.path, resourcesFolder),
      logLevel: process.env['LOG_LEVEL'] || (prod && 'info') || 'debug',
      logTargets: _.split(logTargets, ',') || ['console'],
      cloudWatchGroup: process.env['CLOUDWATCH_GROUP'],
      cloudWatchStream: process.env['CLOUDWATCH_STREAM'],
      maxDownloadSize: parseInt(process.env['MAX_DOWNLOAD_SIZE'] as string) || 12 << 23,
      markovSentenceCacheSize: parseInt(process.env['MARKOV_CACHE_SIZE'] as string) || 3500,
      markovMinLength: parseInt(process.env['MARKOV_MIN_LENGTH'] as string) || 10,
      markovMaxLength: parseInt(process.env['MARKOV_MAX_LENGTH'] as string) || 50,
      markovProbabilityIncrease: markovProb.length
        ? [parseFloat(markovProb[0]), parseFloat(markovProb[1])]
        : [0.25, 1.5],
    };

    ensureDirSync(Env.config.httpCacheFolder);
  }
}
