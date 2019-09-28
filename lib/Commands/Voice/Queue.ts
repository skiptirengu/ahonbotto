import { shuffle, lowerCase } from 'lodash'
import { Message, MessageEmbedOptions } from 'discord.js'
import { scoped, inject } from 'tsyringex'
import { Player } from '../../Player/Player'
import { AutoParser } from '../../Player/Parser/AutoParser'
import { CommandDefinition, CommandType, Command } from '../Command'
import { embed } from '../../Util'
import { isPlaylist, Playlist } from '../../Player/Playlist'
import { Playable } from '../../Player/Playable'
import { MalformedUrl } from '../../Player/Exceptions/MalformedUrl'
import { UnsupportedFormat } from '../../Player/Exceptions/UnsupportedFormat'

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
        'Adds a music to the play queue, being "**url**" an youtube video id, playlist url or any valid link. Check [this](https://rg3.github.io/youtube-dl/supportedsites.html) for a complete list of the 1000+ supported sites. To shuffle a playlist pass the argument "**shuffle**" after the playlist link.',
      fields: [
        { name: 'Example:', value: '`!queue http://my.video.com/xD.mp4`', inline: true },
        {
          name: 'Shuffle playlist:',
          value:
            '`!queue https://www.youtube.com/playlist?list=PLhQ3EYAhJISH9kToXYGNNQOLrCo6o2eao shuffle`',
          inline: true
        }
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
    @inject(AutoParser) private readonly parser: AutoParser
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<Message | void> {
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

    let parsed: Playable | Playlist | null = null

    try {
      parsed = await this.parser.parse(url)
    } catch (err) {
      if (err instanceof MalformedUrl || err instanceof UnsupportedFormat) {
        return message.channel.send(
          embed({
            description: err.message
          })
        )
      }
    } finally {
      await message.delete()
    }

    if (isPlaylist(parsed)) {
      let playables = parsed.playables

      // Shuffle the playlist
      const shouldShuffle = lowerCase(params.shift()) === 'shuffle'
      if (shouldShuffle) {
        playables = shuffle(playables)
      }

      // Add all playlist itens to the queue
      this.player.pushAll(message.member.voice.channel, playables)
      await message.channel.send(
        embed({
          description: `Playlist ${parsed.title} queued (${parsed.playables.length} songs)`,
          fields: [
            {
              name: 'Shuffle mode',
              value: shouldShuffle ? 'Yes' : 'No',
              inline: true
            }
          ]
        })
      )
    } else {
      // Add the requested item to the queue x times
      const playable = parsed as Playable
      const times = Number(params.shift()) || 1

      this.player.push(message.member.voice.channel, playable, times)
      await message.channel.send(
        embed({
          description: `${playable.name} queued ${times} time(s)`
        })
      )
    }
  }
}
