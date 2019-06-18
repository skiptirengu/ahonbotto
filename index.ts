import 'reflect-metadata'
import { Client } from 'discord.js'
import { Config } from './lib/Config'
import { bootstrap as bootstrapContainer, container } from './lib/Container'
import { bootstrap as bootstrapEvents } from './lib/Events'

const client = new Client()
bootstrapContainer(client)
bootstrapEvents(client)

client
  .login(container.resolve<Config>('Config').discordToken)
  .catch((reason): void => console.error(reason))
