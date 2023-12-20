import { Playable } from '../Playable';
import { Playlist } from '../Playlist';

export interface Parser {
  /**
   * Parses the URL and returns the corresponding playable
   */
  parse(url: string, full?: boolean): Promise<Playable | Playlist>;
}
