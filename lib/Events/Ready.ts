import { container } from '../Container'
import { Client } from 'discord.js'
import { withCommandPrefix } from '../Util'

export function ready(): void {
  const client = container.resolve<Client>(Client)
  client
    .user!.setActivity(`Try ${withCommandPrefix('help')} command`, { type: 'PLAYING' })
    .catch(console.error)
}
