import { Message, MessageEmbedOptions } from 'discord.js';
import { inject, scoped } from 'tsyringe';
import { Lifecycle } from 'tsyringe';

import { MalformedUrl } from '../../Player/Exceptions/MalformedUrl';
import { UnsupportedFormat } from '../../Player/Exceptions/UnsupportedFormat';
import { AutoParser } from '../../Player/Parser/AutoParser';
import { Playable } from '../../Player/Playable';
import { Player } from '../../Player/Player';
import { PlayerOptions } from '../../Player/PlayerOptions';
import { isPlaylist, Playlist } from '../../Player/Playlist';
import { buildPlayableInfo, embed } from '../../Util';
import { Command, CommandDefinition, CommandType } from '../Command';

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Voice;
  /**
   * @inheritdoc
   */
  command = 'Queue';
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      title: '<url> [<repeat-x-times>] [<autoplay>]',
      description:
        'Adds a music to the play queue, being "**url**" an youtube video id or playlist url.',
      fields: [
        { name: 'Example:', value: '`!queue http://my.video.com/xD.mp4`', inline: true },
        {
          name: 'Shuffle playlist:',
          value:
            '`!queue https://www.youtube.com/playlist?list=PLhQ3EYAhJISH9kToXYGNNQOLrCo6o2eao shuffle`',
          inline: true,
        },
      ],
    };
  }
}

@scoped(Lifecycle.ContainerScoped, 'Queue')
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
  public async run(message: Message, params: string[]): Promise<any> {
    if (!message.member || !message.member.voice || !message.member.voice.channel) {
      return message.channel.send(
        embed({
          description: 'You must be connected to a voice channel in order to queue a song',
        })
      );
    }

    const url = params.shift();
    if (!url) {
      return message.channel.send(
        embed({
          description: 'You should provide a valid URL',
        })
      );
    }

    let parsed: Playable | Playlist | null = null;

    try {
      parsed = await this.parser.parse(url);
    } catch (err) {
      if (err instanceof MalformedUrl || err instanceof UnsupportedFormat) {
        return message.channel.send(
          embed({
            description: err.message,
          })
        );
      }
    } finally {
      await message.delete();
    }

    let embedOptions: MessageEmbedOptions;
    const options = PlayerOptions.createFromArgs(params);

    if (isPlaylist(parsed)) {
      // Add all playlist itens to the queue
      this.player.push(message.member.voice.channel, parsed.playables, options);

      embedOptions = {
        description: `Playlist ${parsed.title} queued (${parsed.playables.length} songs)`,
        fields: [
          {
            name: 'Shuffle mode',
            value: options.shuffle ? 'Yes' : 'No',
            inline: true,
          },
          {
            name: 'Playlist size',
            value: parsed.playables.length.toString(),
            inline: true,
          },
        ],
        thumbnail: {
          url: parsed.thumbnail || undefined,
        },
      };
    } else {
      // Add the requested item to the queue x times
      const playable = parsed as Playable;
      this.player.push(message.member.voice.channel, playable, options);
      embedOptions = buildPlayableInfo(
        playable,
        new PlayerOptions(options.shuffle, this.player.getAutoPlay(), options.times)
      );
    }

    await message.channel.send(embed(embedOptions));
  }
}
