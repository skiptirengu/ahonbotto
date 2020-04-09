import { get } from 'lodash'
import { toNumber } from 'lodash'
import { inject, scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'
import { URL } from 'url'
import { Logger } from 'winston'
import ytdlCore, { videoInfo } from 'ytdl-core'

import { getInfo, linkFromId } from '../../Util'
import { UnsupportedFormat } from '../Exceptions/UnsupportedFormat'
import { Playable } from '../Playable'
import { Playlist } from '../Playlist'
import { Parser } from './Parser'

const mixPlaylistRe = /^([A-Za-z0-9_-]){13}$/
const playlistArgs = ['--dump-single-json', '--flat-playlist']

@scoped(Lifecycle.ContainerScoped)
export class YoutubeParser implements Parser {
  public constructor(
    /**
     * Scoped logger
     */
    @inject('Logger') protected readonly logger: Logger
  ) {}

  /**
   * @inheritdoc
   */
  public async parse(url: string, full?: boolean): Promise<Playable | Playlist> {
    const uri = new URL(url)

    if (uri.searchParams.has('list')) {
      return this.parsePlaylist(uri)
    }

    return this.parseVideo(uri, full)
  }

  private async parseVideo(uri: URL, full?: boolean): Promise<Playable> {
    const info = await ytdlCore.getInfo(uri.href)

    if (info.formats.some((format) => format.live)) {
      throw new UnsupportedFormat('Live streaming not supported')
    }

    const playable: Playable = {
      isLocal: false,
      name: info.title,
      uri: new URL(info.video_url),
      thumbnail: this.selectThumb(info),
      totalTime: toNumber(info.length_seconds),
    }

    if (full) this.setStreamDetails(info, playable)

    return playable
  }

  private setStreamDetails(info: videoInfo, playable: Playable): void {
    const webmOpusFormat = info.formats
      .filter(
        (format) =>
          format.codecs == 'opus' &&
          format.container == 'webm' &&
          Number(format.audioSampleRate) === 48000
      )
      .sort((a, b) => b.averageBitrate - a.averageBitrate)
      .shift()

    if (webmOpusFormat) {
      this.logger.info('Found webm/opus compatible stream!', { video: info.title, vid: info.vid })
      playable.streamType = 'webm/opus'
      playable.fileUri = new URL(webmOpusFormat.url)
      return
    }

    const formats = info.formats.filter((format) => !format.isDashMPD)

    let format = ytdlCore.chooseFormat(formats, {
      quality: 'highestaudio',
      filter: 'audioonly',
    })

    if (format instanceof Error) {
      format = ytdlCore.chooseFormat(formats, {
        quality: 'lowestvideo',
      })
    }

    if (format instanceof Error) {
      throw format
    }

    playable.fileUri = new URL(format.url)
  }

  private selectThumb(info: videoInfo): string | undefined {
    const thumbs: {
      url: string
      width: number
      height: number
    }[] = get(info, 'player_response.videoDetails.thumbnail.thumbnails') || []
    const selected = thumbs.pop()
    return selected && selected.url
  }

  private async parsePlaylist(uri: URL): Promise<Playlist> {
    const list = uri.searchParams.get('list')!

    if (mixPlaylistRe.test(list)) {
      throw new UnsupportedFormat(
        'Youtube "Mix" playlists are not supported. Consider saving the playlist before queing it up again.'
      )
    }

    const info = await getInfo(uri.href, playlistArgs)
    const playlist: Playlist = {
      title: info.title,
      thumbnail: info.thumbnail,
      playables: info.entries!.map(
        (item): Playable => ({
          name: item.title,
          isLocal: false,
          uri: new URL(linkFromId(item.id)),
        })
      ),
    }

    return playlist
  }
}
