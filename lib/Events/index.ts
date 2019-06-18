import { Client } from 'discord.js'
import { ready as readyEvent } from './Ready'
import { message as messageEvent } from './Message'

export function bootstrap(client: Client): void {
  client.on('ready', readyEvent)
  client.on('message', messageEvent)
}
