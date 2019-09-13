import { Command, CommandType, CommandDefinition } from '..'
import { Message, MessageEmbedOptions } from 'discord.js'
import { scoped, singleton } from 'tsyringex'

@singleton()
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text
  /**
   * @inheritdoc
   */
  command = 'Karen'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: '¯\\_(ツ)_/¯'
    }
  }
}

@scoped('Karen')
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
