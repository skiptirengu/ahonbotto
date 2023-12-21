import { EmbedBuilder, EmbedData, Message } from 'discord.js';
import { inject, Lifecycle, scoped } from 'tsyringe';

import json from '../../../package.json';
import { Config } from '../../Config/index.js';
import { Command, CommandDefinition, CommandType } from '../Command.js';

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text;
  /**
   * @inheritdoc
   */
  command = 'About';
  /**
   * @inheritdoc
   */
  public usage(): EmbedData {
    return {
      description: 'Show some useless information about this bot.',
    };
  }
}

@scoped(Lifecycle.ContainerScoped, 'About')
export class About implements Command {
  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<Message | Message[]> {
    const imageUrl = message.client.user!.avatarURL() || message.client.user!.defaultAvatarURL;

    const embed = EmbedBuilder.from({
      title: json.description,
      url: json.repository.url,
      color: this.config.embedColor,
      thumbnail: {
        url: imageUrl,
      },
      author: {
        name: 'Some guy',
        url: 'https://github.com/skiptirengu/ahonbotto',
        icon_url: imageUrl,
      },
      fields: [
        {
          name: 'License',
          value: json.license,
        },
      ],
    });

    return message.channel.send({ embeds: [embed] });
  }
}
