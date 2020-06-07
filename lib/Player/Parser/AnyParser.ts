import { scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'
import { Info } from 'youtube-dl'

import { getInfo, isYtdlPlaylist } from '../../Util'
import { UnsupportedFormat } from '../Exceptions/UnsupportedFormat'
import { Playable } from '../Playable'
import { Playlist } from '../Playlist'
import { Parser } from './Parser'

const youtubedlOptions = [
  '-f',
  'bestaudio/best',
  '--skip-download',
  '--prefer-insecure',
  '--no-playlist',
  '--dump-single-json',
  '--flat-playlist',
]

@scoped(Lifecycle.ContainerScoped)
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
      thumbnail: info.thumbnail,
    }
  }

  private async execute(url: string): Promise<Info> {
    return getInfo(url, youtubedlOptions)
  }
}
