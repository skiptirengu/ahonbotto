import { Command, CommandType, CommandDefinition } from '..'
import { Message, MessageEmbed } from 'discord.js'
import { injectAll, injectable, inject } from 'tsyringex'
import { Config } from '../../Config'
import { withCommandPrefix } from '../../Util'

export const definition: CommandDefinition = {
  /**
   * @inheritdoc
   */
  type: CommandType.Text,
  /**
   * @inheritdoc
   */
  command: 'Help',
  /**
   * @inheritdoc
   */
  usage: () => ({
    title: 'List all commands this bot has.'
  })
}

@injectable()
export class Help implements Command {
  public constructor(
    /**
     * List of commands bound to the container
     */
    @injectAll('CommandDefinition') protected readonly commands: CommandDefinition[],
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config
  ) {}

  private filter(type: CommandType): string {
    return this.commands
      .filter((x): boolean => x.type == type)
      .map((x): string => withCommandPrefix(x.command.toLowerCase()))
      .join(' ')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: Message, _params: string[]): Promise<Message | Message[]> {
    const embed = new MessageEmbed({
      fields: [
        {
          name: 'Voice commands:',
          value: this.filter(CommandType.Voice) || 'No commands'
        },
        {
          name: 'Text commands:',
          value: this.filter(CommandType.Text) || 'No commands'
        }
      ]
    })

    const commandName = withCommandPrefix('usage')

    return message.channel.send(
      `Use \`${commandName} <command-name>\` for information about an specific command`,
      embed
    )
  }
}
