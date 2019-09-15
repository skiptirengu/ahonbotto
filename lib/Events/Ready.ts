import { container } from '../Container'
import { Client } from 'discord.js'
import { withCommandPrefix } from '../Util'
import { Logger } from 'winston'
import { Config } from '../Config'

export function ready(): void {
  const client = container.resolve<Client>(Client)
  const logger = container.resolve<Logger>('Logger')
  const config = container.resolve<Config>('Config')
  client
    .user!.setActivity(`Try ${withCommandPrefix('help')} command`, { type: 'PLAYING' })
    .then(() => {
      logger.info('Initialization completed using following configuration', {
        prefixes: config.commandPrefixes,
        embedColor: config.embedColor,
        httpCacheFolder: config.httpCacheFolder,
        resourcesFolder: config.resourcesFolder
      })
    })
    .catch((error: any) => logger.error('Uncaught error on ready event handler', { error }))
}
