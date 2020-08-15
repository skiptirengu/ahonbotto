import { Message } from 'discord.js';
import { inject, scoped } from 'tsyringe';
import { Lifecycle } from 'tsyringe';

import { Config } from '../../Config';
import { Player } from '../../Player/Player';
import { AudioFileCommand, AudioFileCommandDefinition } from '../AudioFileCommand';

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class CommandDefinition extends AudioFileCommandDefinition {
  /**
   * @inheritdoc
   */
  file = 'ayaya';
  /**
   * @inheritdoc
   */
  command = 'Ayaya';
}

@scoped(Lifecycle.ContainerScoped, 'Ayaya')
export class Jeff extends AudioFileCommand {
  /**
   * @inheritdoc
   */
  protected filename = 'ayaya.webm';
  /**
   * @inheritdoc
   */
  protected name = 'AYAYA! AYAYA! AYAYA! AYAYA!';

  public constructor(
    /**
     * Bot configuration
     */
    @inject('Config') protected readonly config: Config,
    /**
     * Player instance
     */
    @inject(Player) protected readonly player: Player
  ) {
    super(config, player);
  }

  public async run(message: Message, params: string[]): Promise<void> {
    await message.reply('https://tenor.com/2F3R.gif');
    await super.run(message, params);
  }
}
