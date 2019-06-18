import { Command, CommandType, CommandDefinition } from '..'
import { Message } from 'discord.js'
import { injectable } from 'tsyringex'

export const definition: CommandDefinition = {
  /**
   * @inheritdoc
   */
  type: CommandType.Text,
  /**
   * @inheritdoc
   */
  command: 'Karen',
  /**
   * @inheritdoc
   */
  usage: () => ({
    description: '¯\\_(ツ)_/¯'
  })
}

@injectable()
export class Karen implements Command {
  /**
   * LUL
   */
  private readonly url: string = 'https://skiptirengu.com/karen.png'

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: Message, _params: string[]): Promise<Message | Message[]> {
    return message.channel.send(this.url)
  }
}
