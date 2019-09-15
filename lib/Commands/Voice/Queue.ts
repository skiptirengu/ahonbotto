import { Message, MessageEmbedOptions } from 'discord.js'
import { scoped, inject } from 'tsyringex'
import { Player } from '../../Player/Player'
import { UrlParser } from '../../Player/UrlParser'
import { CommandDefinition, CommandType, Command } from '../Command'
import { embed } from '../../Util'

@scoped('CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Voice
  /**
   * @inheritdoc
   */
  command = 'Queue'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      title: '<url> [<repeat-x-times>]',
      description:
        'Adds a music to the play queue, being "**url**" an youtube video id or any valid link. Check [this](https://rg3.github.io/youtube-dl/supportedsites.html) for a complete list of the 1000+ supported sites.',
      fields: [
        { name: 'Example:', value: '`!queue http://my.video.com/xD.mp4`', inline: true },
        { name: 'Or:', value: '`!queue dQw4w9WgXcQ 4`', inline: true }
      ]
    }
  }
}

@scoped('Queue')
export class Queue implements Command {
  public constructor(
    /**
     * All command definitions bound to the container
     */
    @inject(Player) private readonly player: Player,
    /**
     * Youtubedl URL parser
     */
    @inject(UrlParser) private readonly parser: UrlParser
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<Message> {
    if (!message.member || !message.member.voice || !message.member.voice.channel) {
      return message.channel.send(
        embed({
          description: 'You must be connected to a voice channel in order to queue a song'
        })
      )
    }

    const url = params.shift()
    if (!url) {
      return message.channel.send(
        embed({
          description: 'You should provide a valid URL'
        })
      )
    }

    const playable = await this.parser.parse(url)
    const times = Number(params.shift()) || 1

    this.player.push(message.member.voice.channel, playable, times)
    return message.channel.send(
      embed({
        description: `${playable.name} queued ${times} time(s)`
      })
    )
  }
}
