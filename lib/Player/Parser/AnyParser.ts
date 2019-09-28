import { Parser } from './Parser'
import { Playable } from '../Playable'
import { getInfo, isYtdlPlaylist } from '../../Util'
import { Info } from 'youtube-dl'
import { Playlist } from '../Playlist'
import { UnsupportedFormat } from '../Exceptions/UnsupportedFormat'
import { scoped } from 'tsyringex'

const youtubedlOptions = [
  '-f',
  'bestaudio/best',
  '--skip-download',
  '--prefer-insecure',
  '--no-playlist',
  '--dump-single-json',
  '--flat-playlist'
]

@scoped()
export class AnyParser implements Parser {
  /**
   * @inheritdoc
   */
  public async parse(url: string): Promise<Playable | Playlist> {
    const info = await this.execute(url)

    if (isYtdlPlaylist(info)) {
      throw new UnsupportedFormat('Only Youtube playlists are supported')
    }

    return {
      name: info.title,
      fileUri: new URL(info.url),
      uri: new URL(info.webpage_url),
      isLocal: false,
      totalTime: info._duration_raw || 0,
      thumbnail: info.thumbnail
    }
  }

  private async execute(url: string): Promise<Info> {
    return getInfo(url, youtubedlOptions)
  }
}
