import { promisify } from 'util';
import { Info } from 'youtube-dl';
import ytdl from 'youtube-dl';

export const getInfo = promisify<string, string[], Info>(ytdl.getInfo);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isYtdlPlaylist(info: any): boolean {
  return (
    typeof info === 'object' &&
    'entries' in info &&
    'title' in info &&
    '_type' in info &&
    info._type == 'playlist'
  );
}
