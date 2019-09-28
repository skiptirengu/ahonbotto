import { get } from 'lodash'
import ytdlCore, { videoInfo } from 'ytdl-core'
import { Parser } from './Parser'
import { Playable } from '../Playable'
import { URL } from 'url'
import { UnsupportedPlaylist } from '../Exceptions/UnsupportedPlaylist'
import { Playlist } from '../Playlist'
import { linkFromId, getInfo } from '../../Util'
import { toNumber } from 'lodash'
import { scoped } from 'tsyringex'

const mixPlaylistRe = /^([A-Za-z0-9_-]){13}$/
const playlistArgs = ['--dump-single-json', '--flat-playlist']

@scoped()
export class YoutubeParser implements Parser {
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
    const info = await (full ? ytdlCore.getInfo(uri.href) : ytdlCore.getBasicInfo(uri.href))

    const playable: Playable = {
      isLocal: false,
      name: info.title,
      uri: new URL(info.video_url),
      thumbnail: this.selectThumb(info),
      totalTime: toNumber(info.length_seconds)
    }

    if (full) this.setStreamDetails(info, playable)

    return playable
  }

  private setStreamDetails(info: videoInfo, playable: Playable): void {
    let format = ytdlCore.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly'
    })

    if (!format) format = ytdlCore.chooseFormat(info.formats, { quality: 'lowestvideo' })

    if (format instanceof Error) {
      throw format
    }

    playable.fileUri = new URL(format.url)

    if (
      format.audioEncoding == 'opus' &&
      format.container == 'webm' &&
      format.audio_sample_rate == '48000'
    ) {
      playable.streamType = 'webm/opus'
    }
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
      throw new UnsupportedPlaylist(
        'Youtube "Mix" playlists are not supported. Consider saving the playlist before queing it up again.'
      )
    }

    const info = await getInfo(uri.href, playlistArgs)
    const playlist: Playlist = {
      title: info.title,
      playables: info.entries!.map(
        (item): Playable => ({
          name: item.title,
          isLocal: false,
          uri: new URL(linkFromId(item.id))
        })
      )
    }

    return playlist
  }
}
