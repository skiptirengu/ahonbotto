import { Command, CommandDefinition, normalizeCommandName, CommandType, typedCommandName } from '..'
import { Message } from 'discord.js'
import { injectAll, injectable } from 'tsyringex'
import { first } from 'lodash'
import { withCommandPrefix } from '../../Util'

export const definition: CommandDefinition = {
  /**
   * @inheritdoc
   */
  type: CommandType.Text,
  /**
   * @inheritdoc
   */
  command: 'Usage',
  /**
   * @inheritdoc
   */
  usage: () => ({
    title: '<command>',
    description: 'It does ***EXACTLY*** what you think it does.',
    fields: [{ name: 'Example:', value: `\`${withCommandPrefix('usage')} usage\``, inline: true }]
  })
}

@injectable()
export class Usage implements Command {
  public constructor(
    @injectAll('CommandDefinition') private readonly definitions: CommandDefinition[]
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: Message, params: string[]): Promise<Message | Message[]> {
    const commandName = first(params)

    if (!commandName) {
      return message.channel.send('You should specify a command name.')
    }

    const definition = this.definitions.find(
      (x) => x.command === normalizeCommandName(commandName)
    )!

    const usage = definition.usage()

    usage.title = withCommandPrefix(typedCommandName(definition.command))
      .concat(' ')
      .concat(usage.title || '')

    return message.channel.send({
      embed: usage
    })
  }
}
