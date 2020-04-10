import './../Storage'
import './../Player'
import './../Commands'
import './../Jobs'

import appRoot from 'app-root-path'
import { Client, Guild } from 'discord.js'
import _ from 'lodash'
import { Format } from 'logform'
import { join } from 'path'
import { container, DependencyContainer } from 'tsyringe'
import { format, Logger, loggers, transports } from 'winston'
import WinstonCloudWatch from 'winston-cloudwatch'
import * as Transport from 'winston-transport'

import { Config } from '../Config'

const runtimeFolder = join(appRoot.path, 'runtime')
const resourcesFolder = 'resources'
const logFolder = 'logs'
const cacheFolder = 'http-cache'

const scopeMap = new Map<string, DependencyContainer>()

export function bootstrap(client: Client): void {
  const prod = process.env['NODE_ENV'] === 'production'
  const prefixes = process.env['COMMAND_PREFIXES'] as string
  const logTargets = process.env['LOG_TARGETS'] as string

  // build config object
  const config: Config = {
    discordToken: process.env['DISCORD_TOKEN'] as string,
    youtubeToken: process.env['YOUTUBE_TOKEN'] as string,
    commandPrefixes: _.split(prefixes, ',') || ['!'],
    runtimeFolder: runtimeFolder,
    embedColor: 0x1882ac,
    cleanupInverval: 10,
    httpCacheFolder: join(runtimeFolder, cacheFolder),
    resourcesFolder: join(appRoot.path, resourcesFolder),
    logLevel: process.env['LOG_LEVEL'] || (prod && 'info') || 'debug',
    logTargets: _.split(logTargets, ',') || ['console'],
    cloudWatchGroup: process.env['CLOUDWATCH_GROUP'],
    cloudWatchStream: process.env['CLOUDWATCH_STREAM'],
    maxDownloadSize: parseInt(process.env['MAX_DOWNLOAD_SIZE'] as string) || 12 << 23,
  }

  // register config object
  container.register<Config>('Config', { useValue: config })
  // shared logger
  container.register('Logger', {
    useValue: createLogger('shared', 'Shared Logger', config),
  })
  // register client
  container.register(Client, { useValue: client })
}

export function getScopes(): Map<string, DependencyContainer> {
  return scopeMap
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
    useValue: createLogger(name, guild.name, config),
  })

  return scope
}

function createLogger(id: string, label: string, config: Config): Logger {
  const level = config.logLevel
  const transports = config.logTargets.map((target) => createTarget(config, target))
  return loggers.add(id, {
    format: format.combine(format.label({ label }), format.timestamp()),
    level: level,
    transports: transports,
  })
}

function createTarget(config: Config, target: string): Transport {
  switch (target.toLowerCase()) {
    case 'console':
      return createConsoleTarget()
    case 'file':
      return createFileTarget()
    case 'cloudwatch':
      return createCloudWatchTarget(config)
    default:
      throw new Error(`Invalid log target "${target}"`)
  }
}

function createFileTarget(): Transport {
  return new transports.File({
    filename: join(runtimeFolder, logFolder, 'combined.log'),
    format: format.combine(createMetadataFormat(), format.prettyPrint()),
  })
}

function createCloudWatchTarget(config: Config): Transport {
  const logger = new WinstonCloudWatch({
    logGroupName: config.cloudWatchGroup,
    logStreamName: config.cloudWatchStream,
    jsonMessage: true,
  })
  logger.format = createMetadataFormat()
  return logger
}

function createMetadataFormat(): Format {
  return format.metadata({
    key: 'metadata',
    fillExcept: ['message', 'label', 'timestamp', 'level'],
  })
}

function createConsoleTarget(): Transport {
  return new transports.Console({
    format: format.combine(
      format.colorize({ all: true }),
      format.printf((info): string => {
        const { timestamp, level, message, label, ...args } = info
        return `${timestamp} [${level}][${label}]: ${message} ${
          Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
        }`
      })
    ),
  })
}

export { container }
