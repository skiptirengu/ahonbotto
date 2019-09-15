import { Message, MessageEmbedOptions } from 'discord.js'
import { scoped, inject } from 'tsyringex'
import { Player } from '../../Player/Player'
import { CommandDefinition, CommandType, Command } from '../Command'

@scoped('CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Voice
  /**
   * @inheritdoc
   */
  command = 'Next'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: 'Skip the current playing audio'
    }
  }
}

@scoped('Next')
export class Next implements Command {
  public constructor(
    /**
     * All command definitions bound to the container
     */
    @inject(Player) private readonly player: Player
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: Message, params: string[]): Promise<void> {
    this.player.next()
    return Promise.resolve()
  }
}
