import { EmbedData, Message } from 'discord.js';
import { inject, scoped } from 'tsyringe';
import { Lifecycle } from 'tsyringe';

import { Player } from '../../Player/Player';
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
  command = 'Stop';
  /**
   * @inheritdoc
   */
  public usage(): EmbedData {
    return {
      description: 'Stop the current playing music and clears the queue',
    };
  }
}

@scoped(Lifecycle.ContainerScoped, 'Stop')
export class Stop implements Command {
  public constructor(
    /**
     * All command definitions bound to the container
     */
    @inject(Player) private readonly player: Player
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<void> {
    await message.delete();
    this.player.stop();
  }
}
