import { inject, scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'

import { Config } from '../../Config'
import { Player } from '../../Player/Player'
import { AudioFileCommand, AudioFileCommandDefinition } from '../AudioFileCommand'

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class CommandDefinition extends AudioFileCommandDefinition {
  /**
   * @inheritdoc
   */
  file = 'yee-xp'
  /**
   * @inheritdoc
   */
  command = 'Yeexp'
}

@scoped(Lifecycle.ContainerScoped, 'Yeexp')
export class Yeexp extends AudioFileCommand {
  /**
   * @inheritdoc
   */
  protected filename = 'yee-xp.webm'
  /**
   * @inheritdoc
   */
  protected name = 'Yeexp'

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
    super(config, player)
  }
}
