import { Command, CommandDefinition, CommandType } from '..'
import { inject, scoped, singleton } from 'tsyringex'
import { SearchRepository } from '../../Player/SearchRepository'
import { Message, MessageEmbedOptions } from 'discord.js'
import { Player } from '../../Player/Player'

@singleton()
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Voice
  /**
   * @inheritdoc
   */
  command = 'Select'
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

@scoped('Select')
export class Select implements Command {
  public constructor(
    /**
     * Repository containing search results
     */
    @inject(SearchRepository) protected readonly repository: SearchRepository,
    /**
     * Player instance
     */
    @inject(Player) protected readonly player: Player
  ) {}

  public async run(message: Message, params: string[]): Promise<Message | Message[]> {
    if (!message.member || !message.member.voice || !message.member.voice.channel) {
      return message.channel.send(
        'You must be connected to a voice channel in order to queue a song'.codeWrap()
      )
    }

    const storageKey = this.repository.buildKey(message)
    const storedSize = this.repository.size(storageKey)

    if (!storedSize) {
      return message.channel.send('You should use the "search" command before'.codeWrap())
    }

    const index = Number(params.shift())
    const value = this.repository.get(storageKey, index)

    if (!index || !value) {
      return message.channel.send(
        `You must provide a number between 1 and ${storedSize}`.codeWrap()
      )
    }

    const times = Number(params.shift()) || 1
    this.player.queuePlayable(message.member!.voice.channel!, value, times)

    return message.channel.send(`${value.name} queued ${times} time(s)`.codeWrap())
  }
}
