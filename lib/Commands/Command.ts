import { Message, MessageEmbedOptions } from 'discord.js'

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
