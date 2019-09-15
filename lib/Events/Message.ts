import { Message as MessagePayload } from 'discord.js'
import { toString, includes } from 'lodash'
import { scopeFactory } from '../Container'
import { Config } from '../Config'
import { Logger } from 'winston'
import { Command } from '../Commands/Command'
import { normalizeCommandName } from '../Util'

export function message(message: MessagePayload): void {
  const usrId = message.author && message.author.id
  const botId = message.client.user && message.client.user.id

  // ignore own messages
  if (usrId != null && botId == usrId) return
  if (!message.guild) return

  const container = scopeFactory(message.guild!)
  const messageParts = message.content.split(' ').filter((item): boolean => !!item)

  const commandWithPrefix = toString(messageParts.shift())
  const prefixes = container.resolve<Config>('Config').commandPrefixes

  if (!includes(prefixes, commandWithPrefix.slice(0, 1))) return

  const command = normalizeCommandName(commandWithPrefix.slice(1))

  // Check if the command is bound to our container
  if (!container.isRegistered(command, true)) return

  const logger = container.resolve<Logger>('Logger')

  container
    .resolve<Command>(command)
    // Run the command
    .run(message, messageParts)
    .catch((error) => logger.error('Uncaught message event handler error', { error }))
}
