import { AudioFileCommand, AudioFileCommandDefinition } from '../AudioFileCommand'
import { scoped, inject } from 'tsyringex'
import { Config } from '../../Config'
import { Player } from '../../Player/Player'

@scoped('CommandDefinition')
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

@scoped('Yeexp')
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
