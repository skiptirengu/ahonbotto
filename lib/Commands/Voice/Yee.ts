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
  file = 'yee'
  /**
   * @inheritdoc
   */
  command = 'Yee'
}

@scoped(Lifecycle.ContainerScoped, 'Yee')
export class Yee extends AudioFileCommand {
  /**
   * @inheritdoc
   */
  protected filename = 'yee.webm'
  /**
   * @inheritdoc
   */
  protected name = 'Yee'

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
