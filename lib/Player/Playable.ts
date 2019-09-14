export interface Playable {
  /**
   * Result name
   */
  name: string
  /**
   * URL of the search result
   */
  uri: string
  /**
   * Whether this is a local stream
   */
  isLocal: boolean
  /**
   * Parsed URL with the file
   */
  fileUri?: string
  /**
   * Total time in seconds
   */
  totalTime?: number
  /**
   * Video thumbnail
   */
  thumbnail?: string
}
