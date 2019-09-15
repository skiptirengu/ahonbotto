import { Message, MessageEmbedOptions } from 'discord.js'
import { scoped, inject } from 'tsyringex'
import { CommandDefinition, CommandType, Command } from '../Command'
import { Config } from '../../Config'
import { join } from 'path'
import { embed } from '../../Util'

@scoped('CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text
  /**
   * @inheritdoc
   */
  command = 'Karen'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: '¯\\_(ツ)_/¯'
    }
  }
}

@scoped('Karen')
export class Karen implements Command {
  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<Message | Message[]> {
    const messageEmbed = embed({
      title: 'muu',
      image: {
        url: 'attachment://karen.png'
      },
      files: [
        {
          attachment: join(this.config.resourcesFolder, 'images', 'karen.png')
        }
      ]
    })

    return message.channel.send(messageEmbed)
  }
}
