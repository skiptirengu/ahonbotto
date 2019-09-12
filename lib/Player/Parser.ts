import youtubedl, { Info } from 'youtube-dl'
import { Playable } from './Playable'
import { injectable } from 'tsyringex'

const youtubedlOptions = [
  '-f',
  'bestaudio/best',
  '--skip-download',
  '--force-ipv4',
  '--prefer-insecure'
]

declare module 'youtube-dl' {
  /**
   * Additional properties to the info interface
   */
  interface Info {
    url: string
    title: string
  }
}

@injectable()
export class Parser {
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
