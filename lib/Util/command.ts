import { chain, first } from 'lodash'
import { Config } from '../Config'
import { container } from 'tsyringex'
import { MessageEmbedOptions, MessageOptions } from 'discord.js'

export function embed(embed: MessageEmbedOptions): MessageOptions {
  return {
    embed: {
      color: getConfig().embedColor,
      ...embed
    }
  }
}

export function normalizeCommandName(name: string): string {
  return (
    chain(name)
      .camelCase()
      .upperFirst()
      .value() || ''
  )
}

export function typedCommandName(name: string): string {
  return chain(name)
    .snakeCase()
    .value()!
}

export const getConfig = (): Config => container.resolve<Config>('Config')

export const withCommandPrefix = (value: string): string => {
  return (first(getConfig().commandPrefixes) || '').concat(value)
}
