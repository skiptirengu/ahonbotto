import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
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
  public usage(): MessageEmbedOptions {
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
    const embed = new MessageEmbed({
      title: json.description,
      url: json.repository.url,
      color: this.config.embedColor,
      thumbnail: {
        url: message.client.user!.avatarURL() || message.client.user!.defaultAvatarURL,
      },
      author: {
        name: 'Thomas Turbando (Skiptir Engu#6682)',
        url: 'https://github.com/skiptirengu',
        iconURL:
          'https://cdn.discordapp.com/avatars/209871057295900673/189523766d448583bb6a73dbfaa2350e.webp',
      },
      fields: [
        {
          name: 'License',
          value: json.license,
        },
      ],
    });

    return message.channel.send({ embed });
  }
}
