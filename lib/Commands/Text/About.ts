import { Command, CommandType, CommandDefinition } from '..'
import { Message, MessageEmbed } from 'discord.js'
import { injectable } from 'tsyringex'
import json from '../../../package.json'

export const definition: CommandDefinition = {
  /**
   * @inheritdoc
   */
  type: CommandType.Text,
  /**
   * @inheritdoc
   */
  command: 'About',
  /**
   * @inheritdoc
   */
  usage: () => ({
    description: 'Show some useless information about this bot.'
  })
}

@injectable()
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
