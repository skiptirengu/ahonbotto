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
   * Parsed URL with the file
   */
  fileUri?: string
}
