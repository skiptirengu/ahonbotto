import { Playable } from '../Playable';
import { Playlist } from '../Playlist';

declare module 'youtube-dl' {
  /**
   * Playlist item dumped with --flat-playlist
   */
  interface PlaylistEntry {
    /**
     * Video title
     */
    title: string;
    /**
     * Video ID
     */
    id: string;
  }

  /**
   * Additional properties to the info interface
   */
  interface Info {
    /**
     * Actual URL with the video
     */
    url: string;
    /**
     * Video title
     */
    title: string;
    /**
     * Friendly URL
     */
    webpage_url: string;
    /**
     * Video thumb
     */
    thumbnail: string;
    /**
     * Playlist videos
     */
    entries?: PlaylistEntry[];
  }
}

export interface Parser {
  /**
   * Parses the URL and returns the corresponding playable
   */
  parse(url: string, full?: boolean): Promise<Playable | Playlist>;
}
