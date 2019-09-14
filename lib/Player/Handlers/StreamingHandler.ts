import { Readable } from 'stream'
import { Guild } from 'discord.js'

export interface StreamingHandler {
  /**
   * Sets the streaming context
   * @param uri
   */
  setContext(uri: string, guild: Guild): Promise<StreamingHandler>
  /**
   * Gets a readable stream from the context
   */
  stream(): Promise<Readable>
}
