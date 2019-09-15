import { singleton, inject } from 'tsyringex'
import { Config } from '../Config'
import { join } from 'path'
import { ensureFileSync } from 'fs-extra'
import SqliteDatabase, { Database } from 'better-sqlite3'

const dbFolder = 'db'

@singleton()
export class Connection {
  /**
   * Database connection
   */
  public readonly database: Database

  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config
  ) {
    const databasePath = join(config.runtimeFolder, dbFolder, 'sqlite.db')
    ensureFileSync(databasePath)
    this.database = new SqliteDatabase(databasePath)
    this.ensureTables()
  }

  private ensureTables(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS media (
        filename             VARCHAR(64) PRIMARY KEY,
        time_marked_deletion INTEGER DEFAULT NULL,
        completed            BOOLEAN DEFAULT FALSE
      )
    `)
  }
}
