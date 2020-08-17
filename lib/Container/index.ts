import './../Storage';
import './../Player';
import './../Commands';
import './../Jobs';
import './../Markov';

import { Client, Guild } from 'discord.js';
import { Format } from 'logform';
import { join } from 'path';
import { container, DependencyContainer } from 'tsyringe';
import { format, Logger, loggers, transports } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import * as Transport from 'winston-transport';

import { Config, Env } from '../Config';

const scopeMap = new Map<string, DependencyContainer>();

export function bootstrap(client: Client): void {
  Env.bootstrap(container, () => {
    const config = container.resolve<Config>('Config');
    const logger = createLogger('shared', 'Shared Logger', config);
    container.register('Logger', { useValue: logger });
    return logger;
  });

  // register client
  container.register(Client, { useValue: client });
}

export function getScopes(): Map<string, DependencyContainer> {
  return scopeMap;
}

export function scopeFactory(guild: Guild): DependencyContainer {
  const name = guild.id;
  if (scopeMap.has(name)) return scopeMap.get(name)!;

  const scope = scopeMap.set(name, container.createChildContainer()).get(name)!;

  // Scoped guild
  scope.register(Guild, {
    useFactory: (dependencyContainer) => {
      const client = dependencyContainer.resolve(Client);
      return client.guilds.resolve(name);
    },
  });

  // Register this scoped container as a dependency too
  scope.register('Container', {
    useValue: scope,
  });

  const config = container.resolve<Config>('Config');
  // Scoped logger
  scope.register('Logger', {
    useValue: createLogger(name, guild.name, config),
  });

  return scope;
}

function createLogger(id: string, label: string, config: Config): Logger {
  const level = config.logLevel;
  const transports = config.logTargets.map((target) => createTarget(config, target));
  return loggers.add(id, {
    format: format.combine(format.label({ label }), format.timestamp()),
    level: level,
    transports: transports,
  });
}

function createTarget(config: Config, target: string): Transport {
  switch (target.toLowerCase()) {
    case 'console':
      return createConsoleTarget(config);
    case 'file':
      return createFileTarget(config);
    case 'cloudwatch':
      return createCloudWatchTarget(config);
    default:
      throw new Error(`Invalid log target "${target}"`);
  }
}

function createFileTarget(config: Config): Transport {
  return new transports.File({
    level: config.logLevel,
    filename: join(config.runtimeFolder, 'logs', 'combined.log'),
    format: format.combine(createMetadataFormat(), format.prettyPrint()),
  });
}

function createCloudWatchTarget(config: Config): Transport {
  const logger = new WinstonCloudWatch({
    logStreamName: () => {
      const date = new Date().toISOString().split('T')[0];
      return `${config.cloudWatchStream}-${date}`;
    },
    logGroupName: config.cloudWatchGroup,
    jsonMessage: true,
    level: config.logLevel,
  });
  logger.format = createMetadataFormat();
  return logger;
}

function createMetadataFormat(): Format {
  return format.metadata({
    key: 'metadata',
    fillExcept: ['message', 'label', 'timestamp', 'level'],
  });
}

function createConsoleTarget(config: Config): Transport {
  return new transports.Console({
    level: config.logLevel,
    format: format.combine(
      format.colorize({ all: true }),
      format.printf((info): string => {
        const { timestamp, level, message, label, ...args } = info;
        return `${timestamp} [${level}][${label}]: ${message} ${
          Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
        }`;
      })
    ),
  });
}

export { container };
