import { Statement } from 'better-sqlite3';
import { inject, singleton } from 'tsyringe';

import { Connection } from './Connection';
import { MarkovChain, MarkovChainSentence } from './Models/Markov';

@singleton()
export class MarkovChainRepository {
  private readonly cache: Map<string, MarkovChain> = new Map();
  private readonly stmtEnable: Statement<any[]>;
  private readonly stmtFindMarkovByGuild: Statement<any[]>;
  private readonly stmtDisable: Statement<any[]>;
  private readonly stmtDeleteAllSentences: Statement<any[]>;
  private readonly stmtDeleteSentences: Statement<any[]>;
  private readonly stmtInsertSentence: Statement<any[]>;

  public constructor(
    /**
     * SQLite connection
     */
    @inject(Connection) protected readonly connection: Connection
  ) {
    this.stmtEnable = this.connection.database.prepare(`
      INSERT INTO markov_chain (guild, channel, enabled) 
      VALUES (@guild, @channel, TRUE)
      ON CONFLICT (guild) DO UPDATE
      SET channel = @channel, enabled = @enabled
      WHERE id = markov_chain.id
    `);

    this.stmtDeleteSentences = this.connection.database.prepare(`
      DELETE FROM markov_chain_sentences
      WHERE id IN (
        SELECT id FROM markov_chain_sentences 
        WHERE markov_chain_id = @chainId
        ORDER BY timestamp DESC
        LIMIT 9999999 OFFSET (@limit - 1)
      )
    `);

    this.stmtInsertSentence = this.connection.database.prepare(`
      INSERT INTO markov_chain_sentences (id, text, timestamp, markov_chain_id) 
      VALUES (@id, @text, @timestamp, @chainId)
    `);

    this.stmtDisable = this.connection.database.prepare(
      'UPDATE markov_chain SET enabled = FALSE WHERE id = @id'
    );

    this.stmtDeleteAllSentences = this.connection.database.prepare(
      'DELETE FROM markov_chain_sentences WHERE markov_chain_id = @id'
    );

    this.stmtFindMarkovByGuild = this.connection.database.prepare(
      'SELECT * FROM markov_chain WHERE channel = @channel'
    );
  }

  public pushSentences(chainId: number, limit: number, sentences: MarkovChainSentence[]): void {
    if (!sentences.length) return;

    const insertSentences = this.connection.database.transaction((s: MarkovChainSentence[]) => {
      s.forEach((x) =>
        this.stmtInsertSentence.run({
          chainId,
          id: x.id!,
          text: x.text,
          timestamp: x.timestamp,
        })
      );
    });

    const writeSentences = this.connection.database.transaction(() => {
      insertSentences(sentences);
      this.stmtDeleteSentences.run({ chainId, limit });
    });

    writeSentences();
  }

  public toggleMarkovFor(guild: string, channel: string): void {
    const markov = this.getMarkovForGuild(guild);

    if (!markov || !markov.enabled) {
      this.stmtEnable.run({ guild, channel });
    } else {
      this.stmtDisable.run({ id: markov.id });
      this.stmtDeleteAllSentences.run({ id: markov.id });
      this.cache.delete(guild);
    }
  }

  public getMarkovForGuild(guild: string): MarkovChain | undefined {
    if (this.cache.has(guild)) return this.cache.get(guild);
    const value: MarkovChain = this.stmtFindMarkovByGuild.get({ guild });
    if (value) this.cache.set(guild, value);
    return value;
  }
}
