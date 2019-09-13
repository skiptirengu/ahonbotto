import appRoot from 'app-root-path'
import { Client } from 'discord.js'
import { container, DependencyContainer } from 'tsyringex'
import { join } from 'path'
import { Config } from '../Config'
import './../Player'
import './../Commands'

const scopeMap = new Map<string, DependencyContainer>()

export function bootstrap(client: Client): void {
  // register config object
  container.register<Config>('Config', {
    useValue: {
      discordToken: process.env['discordToken'] as string,
      youtubeToken: process.env['youtubeToken'] as string,
      commandPrefixes: ['$'],
      runtimeFolder: join(appRoot.path, 'runtime')
    }
  })
  // register client
  container.register(Client, { useValue: client })
}

export function scopeFactory(name: string): DependencyContainer {
  return (
    (scopeMap.has(name) && scopeMap.get(name)!) ||
    scopeMap.set(name, container.createScope()).get(name)!
  )
}

export { container }
