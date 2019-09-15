import appRoot from 'app-root-path'
import { Client, Guild } from 'discord.js'
import { container, DependencyContainer } from 'tsyringex'
import { join } from 'path'
import { Config } from '../Config'
import { loggers, format, transports, LoggerOptions } from 'winston'
import './../Storage'
import './../Player'
import './../Commands'
import dayjs from 'dayjs'

const runtimeFolder = join(appRoot.path, 'runtime')
const logFolder = 'logs'

const scopeMap = new Map<string, DependencyContainer>()

export function bootstrap(client: Client): void {
  // register config object
  container.register<Config>('Config', {
    useValue: {
      discordToken: process.env['discordToken'] as string,
      youtubeToken: process.env['youtubeToken'] as string,
      commandPrefixes: ['$'],
      runtimeFolder: runtimeFolder,
      embedColor: 0x1882ac
    }
  })
  // shared logger
  container.register('Logger', {
    useValue: createLogger('shared', 'Shared Logger')
  })
  // register client
  container.register(Client, { useValue: client })
}

export function scopeFactory(guild: Guild): DependencyContainer {
  const name = guild.id
  if (scopeMap.has(name)) return scopeMap.get(name)!

  const scope = scopeMap.set(name, container.createScope()).get(name)!

  // Scoped guild
  scope.register(Guild, {
    useFactory: (dependencyContainer) => {
      const client = dependencyContainer.resolve(Client)
      return client.guilds.get(name)
    }
  })

  // Register this scoped container as a dependency too
  scope.register('Container', {
    useValue: scope
  })

  // Scoped logger
  scope.register('Logger', {
    useValue: createLogger(name, guild.name)
  })

  return scope
}

function createLogger(id: string, label: string): LoggerOptions {
  return loggers.add(id, {
    format: format.combine(
      format.label({ label }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      format.timestamp({
        format: () => {
          const localDate = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
          return dayjs(localDate).format()
        }
      }),
      format.simple()
    ),
    transports: [
      new transports.File({
        filename: join(runtimeFolder, logFolder, 'combined.log')
      })
    ]
  })
}

export { container }
