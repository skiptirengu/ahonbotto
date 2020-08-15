import { Message, MessageEmbedOptions } from 'discord.js';
import { inject, Lifecycle, scoped } from 'tsyringe';

import { Player } from '../../Player/Player';
import { Command, CommandDefinition, CommandType } from '../Command';
import { Playing } from './Playing';

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Voice;
  /**
   * @inheritdoc
   */
  command = 'Autoplay';
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: 'Enables automatic queing of related songs for the current session',
    };
  }
}

@scoped(Lifecycle.ContainerScoped, 'Autoplay')
export class Autoplay implements Command {
  public constructor(
    /**
     * Scoped player
     */
    @inject(Player) private readonly player: Player,
    /**
     * "Playing" command
     */
    @inject(Playing) private readonly playingCommand: Playing
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<void | Message> {
    const autoPlay = this.player.getAutoPlay();
    this.player.setAutoPlay(!autoPlay);
    return this.playingCommand.run(message, params);
  }
}
