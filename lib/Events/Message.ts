import { Message as MessagePayload } from 'discord.js'
import { toString, includes } from 'lodash'
import { scopeFactory } from '../Container'
import { Command, normalizeCommandName } from '../Commands'
import { Config } from '../Config'

export function message(message: MessagePayload): void {
  const usrId = message.author && message.author.id
  const botId = message.client.user && message.client.user.id

  // ignore own messages
  if (usrId != null && botId == usrId) return
  if (!message.guild) return

  const container = scopeFactory(message.guild!.id)
  const messageParts = message.content.split(' ').filter((item): boolean => !!item)

  const commandWithPrefix = toString(messageParts.shift())
  const prefixes = container.resolve<Config>('Config').commandPrefixes

  if (!includes(prefixes, commandWithPrefix.slice(0, 1))) return

  const command = normalizeCommandName(commandWithPrefix.slice(1))

  // Check if the command is bound to our container
  if (!container.isRegistered(command, true)) return

  container
    .resolve<Command>(command)
    // Run the command
    .run(message, messageParts)
    // TODO properly log the
    .catch((reason) => console.log(reason))
}
