import { Command, CommandType, CommandDefinition } from '..'
import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js'
import { scoped, singleton } from 'tsyringex'
import json from '../../../package.json'

@singleton()
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: Message, _params: string[]): Promise<Message | Message[]> {
    const embed = new MessageEmbed({
      title: json.description,
      url: json.repository.url,
      thumbnail: { url: 'https://skiptirengu.com/arrombot.jpg' },
      author: {
        name: 'Thomas Turbando (Skiptir Engu#6682)',
        url: 'https://skiptirengu.com',
        iconURL: 'https://skiptirengu.com/profile.png'
      },
      fields: [{ name: 'License', value: json.license }]
    })

    return message.channel.send({ embed })
  }
}
