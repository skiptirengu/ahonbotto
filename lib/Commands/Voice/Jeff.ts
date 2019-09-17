import { AudioFileCommand, AudioFileCommandDefinition } from '../AudioFileCommand'
import { scoped, inject } from 'tsyringex'
import { Config } from '../../Config'
import { Player } from '../../Player/Player'

@scoped('CommandDefinition')
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

@scoped('Jeff')
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
