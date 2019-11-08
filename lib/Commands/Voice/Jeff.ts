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
  file = 'jeff'
  /**
   * @inheritdoc
   */
  command = 'Jeff'
}

@scoped(Lifecycle.ContainerScoped, 'Jeff')
export class Jeff extends AudioFileCommand {
  /**
   * @inheritdoc
   */
  protected filename = 'jeff.webm'
  /**
   * @inheritdoc
   */
  protected name = 'Jeff'

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
