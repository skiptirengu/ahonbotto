import './Text/About'
import './Text/Avatar'
import './Text/Help'
import './Text/Karen'
import './Text/Usage'
import './Voice/Next'
import './Voice/Search'
import './Voice/Select'
import './Voice/Stop'

import { Message, MessageEmbedOptions } from 'discord.js'
import { chain } from 'lodash'

/**
 * Interface implemented by all available commands
 */
export interface Command {
  /**
   * Runs the command
   * @param message The discord message instance
   * @param params The command params
   */
  run(message: Message, params: string[]): Promise<Message | Message[] | void>
}

/**
 * Types of commands
 */
export enum CommandType {
  Text,
  Voice
}

/**
 * Interface containing usage information about the command
 */
export interface CommandDefinition {
  /**
   * Command title
   */
  command: string
  /**
   * Command type
   */
  type: CommandType
  /**
   * Command type
   */
  usage: () => MessageEmbedOptions
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
