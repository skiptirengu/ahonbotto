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
  /**
   * Minimum log level
   */
  logLevel?: string
  /**
   * Log to targets
   */
  logTargets: string[]
  /**
   * CloudWatch log group
   */
  cloudWatchGroup?: string
  /**
   * CloudWatch log stream
   */
  cloudWatchStream?: string
}
