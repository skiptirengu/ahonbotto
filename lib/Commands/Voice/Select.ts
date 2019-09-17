import { inject, scoped } from 'tsyringex'
import { SearchRepository } from '../../Player/SearchRepository'
import { Message, MessageEmbedOptions } from 'discord.js'
import { Player } from '../../Player/Player'
import { CommandDefinition, CommandType, Command } from '../Command'
import { embed } from '../../Util'
import { toNumber } from 'lodash'

@scoped('CommandDefinition')
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
        embed({
          description: 'You must be connected to a voice channel in order to queue a song'
        })
      )
    }

    const storageKey = this.repository.buildKey(message)
    const storedSize = this.repository.size(storageKey)

    if (!storedSize) {
      return message.channel.send(
        embed({
          description: 'You should use the "search" command before'
        })
      )
    }

    const index = toNumber(params.shift())
    const value = this.repository.get(storageKey, index)

    if (!index || !value) {
      return message.channel.send(
        embed({
          description: `You must provide a number between 1 and ${storedSize}`
        })
      )
    }

    const times = toNumber(params.shift()) || 1
    this.player.push(message.member!.voice.channel!, value, times)

    return message.channel.send(
      embed({
        description: `${value.name} queued ${times} time(s)`
      })
    )
  }
}
