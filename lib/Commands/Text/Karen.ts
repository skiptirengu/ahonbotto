import { Message, MessageEmbedOptions } from 'discord.js';
import { join } from 'path';
import { inject, scoped } from 'tsyringe';
import { Lifecycle } from 'tsyringe';

import { Config } from '../../Config';
import { embed } from '../../Util';
import { Command, CommandDefinition, CommandType } from '../Command';

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text;
  /**
   * @inheritdoc
   */
  command = 'Karen';
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: '¯\\_(ツ)_/¯',
    };
  }
}

@scoped(Lifecycle.ContainerScoped, 'Karen')
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
        url: 'attachment://karen.png',
      },
      files: [
        {
          attachment: join(this.config.resourcesFolder, 'images', 'karen.png'),
        },
      ],
    });

    return message.channel.send(messageEmbed);
  }
}
