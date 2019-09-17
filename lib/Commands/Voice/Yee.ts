import { AudioFileCommand, AudioFileCommandDefinition } from '../AudioFileCommand'
import { scoped, inject } from 'tsyringex'
import { Config } from '../../Config'
import { Player } from '../../Player/Player'

@scoped('CommandDefinition')
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

@scoped('Yee')
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
