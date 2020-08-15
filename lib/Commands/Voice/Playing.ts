import { Message, MessageEmbedOptions } from 'discord.js';
import { inject, scoped } from 'tsyringe';
import { Lifecycle } from 'tsyringe';

import { Player } from '../../Player/Player';
import { PlayerOptions } from '../../Player/PlayerOptions';
import { buildPlayableInfo, embed } from '../../Util';
import { Command, CommandDefinition, CommandType } from '../Command';

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Voice;
  /**
   * @inheritdoc
   */
  command = 'Playing';
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: 'Shows information about the current playing audio',
    };
  }
}

@scoped(Lifecycle.ContainerScoped, 'Playing')
export class Playing implements Command {
  public constructor(
    /**
     * Scoped player
     */
    @inject(Player) private readonly player: Player
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<void | Message> {
    await message.delete();
    const current = this.player.getCurrentPlayable();

    if (!current) {
      return message.channel.send(
        embed({
          description: "There's nothing playing at the moment",
        })
      );
    }

    const streamingTime = this.player.getStreamingTime();
    const messageEmbed = buildPlayableInfo(
      current,
      new PlayerOptions(false, this.player.getAutoPlay()),
      streamingTime
    );

    await message.channel.send({ embed: messageEmbed });
  }
}
