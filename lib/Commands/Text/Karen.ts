import { AttachmentBuilder, EmbedBuilder, EmbedData, Message } from 'discord.js';
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
  public usage(): EmbedData {
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
    const file = new AttachmentBuilder(join(this.config.resourcesFolder, 'images', 'karen.png'));

    const messageEmbed = EmbedBuilder.from(
      embed({
        title: 'muu',
        image: {
          url: 'attachment://karen.png',
        },
      })
    );

    return message.channel.send({ embeds: [messageEmbed], files: [file] });
  }
}
