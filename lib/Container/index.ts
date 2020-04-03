import './../Storage'
import './../Player'
import './../Commands'
import './../Jobs'

import appRoot from 'app-root-path'
import { Client, Guild } from 'discord.js'
import { join } from 'path'
import { container, DependencyContainer } from 'tsyringe'
import { format, Logger, loggers, transports } from 'winston'

import { Config } from '../Config'

const runtimeFolder = join(appRoot.path, 'runtime')
const resourcesFolder = 'resources'
const logFolder = 'logs'
const cacheFolder = 'http-cache'

const scopeMap = new Map<string, DependencyContainer>()

export function bootstrap(client: Client): void {
  const prod = process.env['NODE_ENV'] === 'production'
  // build config object
  const config = {
    discordToken: process.env['DISCORD_TOKEN'] as string,
    youtubeToken: process.env['YOUTUBE_TOKEN'] as string,
    commandPrefixes: (process.env['COMMAND_PREFIXES'] &&
      process.env['COMMAND_PREFIXES']!.split(',')) || ['!'],
    runtimeFolder: runtimeFolder,
    embedColor: 0x1882ac,
    cleanupInverval: 10,
    httpCacheFolder: join(runtimeFolder, cacheFolder),
    resourcesFolder: join(appRoot.path, resourcesFolder),
    logLevel: process.env['LOG_LEVEL'] || (prod && 'info') || 'debug',
  }
  // register config object
  container.register<Config>('Config', { useValue: config })
  // shared logger
  container.register('Logger', {
    useValue: createLogger('shared', 'Shared Logger', config.logLevel),
  })
  // register client
  container.register(Client, { useValue: client })
}

export function scopeFactory(guild: Guild): DependencyContainer {
  const name = guild.id
  if (scopeMap.has(name)) return scopeMap.get(name)!

  const scope = scopeMap.set(name, container.createChildContainer()).get(name)!

  // Scoped guild
  scope.register(Guild, {
    useFactory: (dependencyContainer) => {
      const client = dependencyContainer.resolve(Client)
      return client.guilds.resolve(name)
    },
  })

  // Register this scoped container as a dependency too
  scope.register('Container', {
    useValue: scope,
  })

  const config = container.resolve<Config>('Config')
  // Scoped logger
  scope.register('Logger', {
    useValue: createLogger(name, guild.name, config.logLevel),
  })

  return scope
}

function createLogger(id: string, label: string, level?: string): Logger {
  return loggers.add(id, {
    format: format.combine(format.label({ label }), format.timestamp()),
    level: level,
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize({ all: true }),
          format.printf((info): string => {
            const { timestamp, level, message, label, ...args } = info
            return `${timestamp} [${level}][${label}]: ${message} ${
              Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
            }`
          })
        ),
      }),
      new transports.File({
        filename: join(runtimeFolder, logFolder, 'combined.log'),
        format: format.prettyPrint(),
      }),
    ],
  })
}

export { container }
