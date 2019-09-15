export interface Config {
  /**
   * YouTube token
   */
  youtubeToken: string
  /**
   * Discord token
   */
  discordToken: string
  /**
   * Supported command prefixes
   */
  commandPrefixes: string[]
  /**
   * Runtime folder
   */
  runtimeFolder: string
  /**
   * Color for embed messages
   */
  embedColor: number
  /**
   * Job cleanup interval
   */
  cleanupInverval: number
  /**
   * Folder used to cache songs
   */
  httpCacheFolder: string
  /**
   * Folder containing bot resources
   */
  resourcesFolder: string
}
