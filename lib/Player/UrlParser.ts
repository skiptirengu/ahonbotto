import youtubedl, { Info } from 'youtube-dl'
import { Playable } from './Playable'
import { autoInjectable, singleton } from 'tsyringex'

const youtubedlOptions = ['-f', 'bestaudio/best', '--skip-download', '--prefer-insecure']

declare module 'youtube-dl' {
  /**
   * Additional properties to the info interface
   */
  interface Info {
    url: string
    title: string
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
    return { name: info.title, uri: info.url }
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
