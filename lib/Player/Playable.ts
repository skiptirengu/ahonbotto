import { StreamType } from 'discord.js'
import { URL } from 'url'

export interface Playable {
  /**
   * Result name
   */
  name: string
  /**
   * URL of the search result
   */
  uri: URL
  /**
   * Whether this is a local stream
   */
  isLocal: boolean
  /**
   * Parsed URL with the file
   */
  fileUri?: URL
  /**
   * Total time in seconds
   */
  totalTime?: number
  /**
   * Video thumbnail
   */
  thumbnail?: string
  /**
   * Audio volume
   */
  volume?: number
  /**
   * Stream type (opus, unknown, etc)
   */
  streamType?: StreamType
  /**
   * Related streams
   */
  related?: Playable[]
}
