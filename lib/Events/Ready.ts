import { container } from '../Container'
import { Client } from 'discord.js'
import { withCommandPrefix } from '../Util'
import { Logger } from 'winston'

export function ready(): void {
  const client = container.resolve<Client>(Client)
  const logger = container.resolve<Logger>('Logger')
  client
    .user!.setActivity(`Try ${withCommandPrefix('help')} command`, { type: 'PLAYING' })
    .then(() => logger.info('Initialization completed'))
    .catch((error: any) => logger.error('Uncaught error on ready event handler', { error }))
}
