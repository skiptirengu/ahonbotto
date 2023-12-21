import { Logger } from 'winston';

import { Config } from '../Config';
import { container } from '../Container';

export function ready(): void {
  const logger = container.resolve<Logger>('Logger');
  const config = container.resolve<Config>('Config');

  logger.info('Initialization completed using following configuration', {
    prefixes: config.commandPrefixes,
    embedColor: config.embedColor,
    httpCacheFolder: config.httpCacheFolder,
    resourcesFolder: config.resourcesFolder,
    logLevel: config.logLevel,
  });
}
