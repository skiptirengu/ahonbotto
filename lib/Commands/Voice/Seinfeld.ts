import { AudioFileCommand, AudioFileCommandDefinition } from '../AudioFileCommand'
import { scoped, inject } from 'tsyringex'
import { Config } from '../../Config'
import { Player } from '../../Player/Player'

@scoped('CommandDefinition')
export class CommandDefinition extends AudioFileCommandDefinition {
  /**
   * @inheritdoc
   */
  file = 'seinfeld'
  /**
   * @inheritdoc
   */
  command = 'Seinfeld'
}

@scoped('Seinfeld')
export class Seinfeld extends AudioFileCommand {
  /**
   * @inheritdoc
   */
  protected filename = 'seinfeld.webm'
  /**
   * @inheritdoc
   */
  protected name = 'Seinfeld'

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
