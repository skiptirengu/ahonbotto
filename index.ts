import './env'
import 'reflect-metadata'
import './lib/Extensions'
import { Client } from 'discord.js'
import { Config } from './lib/Config'
import { bootstrap as bootstrapContainer, container } from './lib/Container'
import { bootstrap as bootstrapEvents } from './lib/Events'
import { Logger } from 'winston'
import { Scheduler } from './lib/Jobs/Scheduler'

const client = new Client()
bootstrapContainer(client)
bootstrapEvents(client)
const logger = container.resolve<Logger>('Logger')

client
  .login(container.resolve<Config>('Config').discordToken)
  .then(() => Scheduler.start())
  .catch((error) => logger.error('Uncaught initialization error', { error }))
