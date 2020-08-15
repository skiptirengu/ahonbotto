import SqliteDatabase, { Database } from 'better-sqlite3';
import { ensureFileSync } from 'fs-extra';
import { join } from 'path';
import { inject, singleton } from 'tsyringe';

import { Config } from '../Config';

const dbFolder = 'db';

@singleton()
export class Connection {
  /**
   * Database connection
   */
  public readonly database: Database;

  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config
  ) {
    const databasePath = join(config.runtimeFolder, dbFolder, 'sqlite.db');
    ensureFileSync(databasePath);
    this.database = new SqliteDatabase(databasePath);
    this.ensureTables();
  }

  private ensureTables(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS media (
        filename             VARCHAR(64) PRIMARY KEY,
        time_marked_deletion INTEGER DEFAULT NULL,
        completed            BOOLEAN DEFAULT FALSE
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS markov_chain (
        id      INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        guild   VARCHAR(32) NOT NULL,
        channel VARCHAR(32) NOT NULL,
        enabled BOOLEAN DEFAULT FALSE
      )
    `);

    this.database.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_markov_chain_guild
      ON markov_chain (guild)
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS markov_chain_sentences (
        id              VARCHAR(64) PRIMARY KEY,
        text            TEXT    NOT NULL,
        timestamp       INTEGER NOT NULL,
        markov_chain_id INTEGER NOT NULL,
        FOREIGN KEY(markov_chain_id) REFERENCES markov_chain(id)
      );
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_markov_chain_id 
      ON markov_chain_sentences (markov_chain_id)
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_markov_chain_sentence_timestamp
      ON markov_chain_sentences (timestamp)
    `);
  }
}
