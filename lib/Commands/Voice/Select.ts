import { Message, MessageEmbedOptions } from 'discord.js'
import { toNumber } from 'lodash'
import { inject, scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'

import { AutoParser } from '../../Player/Parser/AutoParser'
import { Playable } from '../../Player/Playable'
import { Player } from '../../Player/Player'
import { SearchRepository } from '../../Player/SearchRepository'
import { buildPlayableInfo, embed } from '../../Util'
import { Command, CommandDefinition, CommandType } from '../Command'

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
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
        { name: 'Or:', value: '`!queue dQw4w9WgXcQ 4`', inline: true },
      ],
    }
  }
}

@scoped(Lifecycle.ContainerScoped, 'Select')
export class Select implements Command {
  public constructor(
    /**
     * Repository containing search results
     */
    @inject(SearchRepository) protected readonly repository: SearchRepository,
    /**
     * Player instance
     */
    @inject(Player) protected readonly player: Player,
    /**
     * Youtubedl URL parser
     */
    @inject(AutoParser) private readonly parser: AutoParser
  ) {}

  public async run(message: Message, params: string[]): Promise<Message> {
    await message.delete()
    if (!message.member || !message.member.voice || !message.member.voice.channel) {
      return message.channel.send(
        embed({
          description: 'You must be connected to a voice channel in order to queue a song',
        })
      )
    }

    const storageKey = this.repository.buildKey(message)
    const storedSize = this.repository.size(storageKey)

    if (!storedSize) {
      return message.channel.send(
        embed({
          description: 'You should use the "search" command before',
        })
      )
    }

    const index = toNumber(params.shift())
    const value = this.repository.get(storageKey, index)

    if (!index || !value) {
      return message.channel.send(
        embed({
          description: `You must provide a number between 1 and ${storedSize}`,
        })
      )
    }

    const playable = (await this.parser.parse(value.uri.toString())) as Playable
    const times = toNumber(params.shift()) || 1
    this.player.push(message.member!.voice.channel!, playable, times)
    const embedOptions = buildPlayableInfo(playable, undefined, times)
    return message.channel.send(embed(embedOptions))
  }
}
