import { Readable } from 'stream'

export interface StreamingHandler {
  /**
   * Sets the streaming context
   * @param uri
   */
  setContext(uri: string): Promise<StreamingHandler>
  /**
   * Gets a readable stream from the context
   */
  stream(): Promise<Readable>
}
