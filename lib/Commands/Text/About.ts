import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js'
import { scoped, inject } from 'tsyringex'
import json from '../../../package.json'
import { CommandDefinition, CommandType, Command } from '../Command.js'
import { Config } from '../../Config/index.js'

@scoped('CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text
  /**
   * @inheritdoc
   */
  command = 'About'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: 'Show some useless information about this bot.'
    }
  }
}

@scoped('About')
export class About implements Command {
  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: Message, params: string[]): Promise<Message | Message[]> {
    const embed = new MessageEmbed({
      title: json.description,
      url: json.repository.url,
      color: this.config.embedColor,
      thumbnail: {
        url:
          'https://cdn.discordapp.com/avatars/219948790403170306/48f855ad7016d300fff2df33491a8aaf.webp'
      },
      author: {
        name: 'Thomas Turbando (Skiptir Engu#6682)',
        url: 'https://github.com/skiptirengu',
        iconURL:
          'https://cdn.discordapp.com/avatars/209871057295900673/189523766d448583bb6a73dbfaa2350e.webp'
      },
      fields: [
        {
          name: 'License',
          value: json.license
        }
      ]
    })

    return message.channel.send({ embed })
  }
}
