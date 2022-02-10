export interface Config {
  /**
   * YouTube token
   */
  youtubeToken: string;
  /**
   * Discord token
   */
  discordToken: string;
  /**
   * Supported command prefixes
   */
  commandPrefixes: string[];
  /**
   * Runtime folder
   */
  runtimeFolder: string;
  /**
   * Color for embed messages
   */
  embedColor: number;
  /**
   * Job cleanup interval
   */
  cleanupInverval: number;
  /**
   * Folder used to cache songs
   */
  httpCacheFolder: string;
  /**
   * Folder containing bot resources
   */
  resourcesFolder: string;
  /**
   * Minimum log level
   */
  logLevel?: string;
  /**
   * Log to targets
   */
  logTargets: string[];
  /**
   * CloudWatch log group
   */
  cloudWatchGroup?: string;
  /**
   * CloudWatch log stream
   */
  cloudWatchStream?: string;
  /**
   * Max youtube file size
   */
  maxDownloadSize: number;
  /**
   * Number of sentences to keep in memory
   */
  markovSentenceCacheSize: number;
  /**
   * Increase probability between x and y
   */
  markovProbabilityIncrease: number[];
  /**
   * Min sentence length
   */
  markovMinLength: number;
  /**
   * Max sentence length
   */
  markovMaxLength: number;
  /**
   * Owner user, allowed to run root commands
   */
  rootUser: string;
}
