import youtubedl, { Info } from 'youtube-dl'
import { Playable } from './Playable'
import { autoInjectable, singleton } from 'tsyringex'
import { URL } from 'url'

const youtubedlOptions = ['-f', 'bestaudio/best', '--skip-download', '--prefer-insecure']

declare module 'youtube-dl' {
  /**
   * Additional properties to the info interface
   */
  interface Info {
    /**
     * Actual URL with the video
     */
    url: string
    /**
     * Video title
     */
    title: string
    /**
     * Friendly URL
     */
    webpage_url: string
    /**
     * Video thumb
     */
    thumbnail: string
  }
}

@autoInjectable()
@singleton()
export class UrlParser {
  /**
   * Parses a URL and returns the actual playable url
   */
  public async parse(url: string): Promise<Playable> {
    const info = await this.execute(url)
    return {
      name: info.title,
      fileUri: new URL(info.url),
      uri: new URL(info.webpage_url),
      isLocal: false,
      totalTime: info._duration_raw || 0,
      thumbnail: info.thumbnail
    }
  }

  private execute(url: string): Promise<Info> {
    return new Promise((resolve, reject) => {
      youtubedl.getInfo(url, youtubedlOptions, (err, out) => {
        if (err) {
          reject(err)
        } else {
          resolve(out)
        }
      })
    })
  }
}
