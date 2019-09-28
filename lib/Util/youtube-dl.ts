import { promisify } from 'util'
import { Info } from 'youtube-dl'
import ytdl from 'youtube-dl'

export const getInfo = promisify<string, string[], Info>(ytdl.getInfo)

export function isYtdlPlaylist(info: any): boolean {
  return (
    typeof info === 'object' &&
    'entries' in info &&
    'title' in info &&
    '_type' in info &&
    info._type == 'playlist'
  )
}
