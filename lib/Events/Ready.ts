import { Client } from 'discord.js'
import { Logger } from 'winston'

import { Config } from '../Config'
import { container } from '../Container'
import { withCommandPrefix } from '../Util'

export function ready(): void {
  const client = container.resolve<Client>(Client)
  const logger = container.resolve<Logger>('Logger')
  const config = container.resolve<Config>('Config')
  client
    .user!.setActivity(`Checkout new ${withCommandPrefix('autoplay')} command`, { type: 'PLAYING' })
    .then(() => {
      logger.info('Initialization completed using following configuration', {
        prefixes: config.commandPrefixes,
        embedColor: config.embedColor,
        httpCacheFolder: config.httpCacheFolder,
        resourcesFolder: config.resourcesFolder,
      })
    })
    .catch((error: any) => logger.error('Uncaught error on ready event handler', { error }))
}
