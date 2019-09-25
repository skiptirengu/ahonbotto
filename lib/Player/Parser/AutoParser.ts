import { Playable } from '../Playable'
import { inject, DependencyContainer, container, scoped } from 'tsyringex'
import { Parser } from './Parser'
import { YoutubeParser } from './YoutubeParser'
import { AnyParser } from './AnyParser'
import { linkFromId, isVideoId, isYoutubeUrl } from '../../Util/youtube'
import { isValidUrl } from '../../Util/url'
import { MalformedUrl } from '../Exceptions/MalformedUrl'
import { Playlist } from '../Playlist'

@scoped()
export class AutoParser implements Parser {
  constructor(
    /**
     * Scoped dependency container
     */
    @inject('Container') protected readonly container: DependencyContainer
  ) {}

  /**
   * Parses a URL and returns the actual playable url
   */
  public async parse(url: string, full?: boolean): Promise<Playable | Playlist> {
    let parser: Parser

    url = this.normalizeUrl(url)

    if (isYoutubeUrl(url)) {
      parser = container.resolve<Parser>(YoutubeParser)
    } else if (isValidUrl(url)) {
      parser = container.resolve<Parser>(AnyParser)
    } else {
      throw new MalformedUrl("This doesn't seem to be a valid URL")
    }

    return parser.parse(url, full)
  }

  private normalizeUrl(url: string): string {
    if (isVideoId(url)) url = linkFromId(url)
    return url
  }
}
