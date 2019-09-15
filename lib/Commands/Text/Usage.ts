import { Message, MessageEmbedOptions } from 'discord.js'
import { injectAll, scoped, inject } from 'tsyringex'
import { first } from 'lodash'
import { withCommandPrefix, normalizeCommandName, typedCommandName, embed } from '../../Util'
import { CommandDefinition, CommandType, Command } from '../Command'
import { Config } from '../../Config'

@scoped('CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text
  /**
   * @inheritdoc
   */
  command = 'Usage'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      title: '<command>',
      description: 'It does ***EXACTLY*** what you think it does.',
      fields: [{ name: 'Example:', value: `\`${withCommandPrefix('usage')} usage\``, inline: true }]
    }
  }
}

@scoped('Usage')
export class Usage implements Command {
  public constructor(
    /**
     * All command definitions bound to the container
     */
    @injectAll('CommandDefinition') private readonly definitions: CommandDefinition[],
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<Message | Message[]> {
    const commandName = first(params)

    if (!commandName) {
      return message.channel.send(
        embed({
          description: 'You should specify a command name'
        })
      )
    }

    const definition = this.definitions.find(
      (x) => x.command === normalizeCommandName(commandName)
    )!

    const usage = definition.usage()

    usage.title = withCommandPrefix(typedCommandName(definition.command))
      .concat(' ')
      .concat(usage.title || '')

    if (!usage.color) usage.color = this.config.embedColor

    return message.channel.send({
      embed: usage
    })
  }
}
