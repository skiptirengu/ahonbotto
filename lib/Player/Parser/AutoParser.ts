import { inject, scoped } from 'tsyringe';
import { Lifecycle } from 'tsyringe';

import { isVideoId, isYoutubeUrl, linkFromId } from '../../Util/youtube';
import { MalformedUrl } from '../Exceptions/MalformedUrl';
import { Playable } from '../Playable';
import { Playlist } from '../Playlist';
import { Parser } from './Parser';
import { YoutubeParser } from './YoutubeParser';

@scoped(Lifecycle.ContainerScoped)
export class AutoParser implements Parser {
  constructor(
    /**
     * Youtube parser implementation
     */
    @inject(YoutubeParser) protected readonly youtubeParser: Parser
  ) {}

  /**
   * Parses a URL and returns the actual playable url
   */
  public async parse(url: string, full?: boolean): Promise<Playable | Playlist> {
    let parser: Parser;

    url = this.normalizeUrl(url);

    if (isYoutubeUrl(url)) {
      parser = this.youtubeParser;
    } else {
      throw new MalformedUrl("This doesn't seem to be a valid URL");
    }

    return parser.parse(url, full);
  }

  private normalizeUrl(url: string): string {
    if (isVideoId(url)) url = linkFromId(url);
    return url;
  }
}
