import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js'
import { inject, injectAll, scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'

import { Config } from '../../Config'
import { withCommandPrefix } from '../../Util'
import { Command, CommandDefinition, CommandType } from '../Command'

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text
  /**
   * @inheritdoc
   */
  command = 'Help'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      title: 'List all commands this bot has.',
    }
  }
}

@scoped(Lifecycle.ContainerScoped, 'Help')
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
      .sort()
      .join(' ')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<Message | Message[]> {
    const embed = new MessageEmbed({
      color: this.config.embedColor,
      fields: [
        {
          name: 'Voice commands:',
          value: this.filter(CommandType.Voice) || 'No commands',
        },
        {
          name: 'Text commands:',
          value: this.filter(CommandType.Text) || 'No commands',
        },
      ],
    })

    const commandName = withCommandPrefix('usage')

    return message.channel.send(
      `Use \`${commandName} <command-name>\` for information about an specific command`,
      embed
    )
  }
}
