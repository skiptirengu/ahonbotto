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
  private readonly stmtGetAllSentences: Statement<any[]>;
  private readonly stmtGetAllPendingEnabled: Statement<any[]>;
  private readonly stmtGetFirstMessage: Statement<any[]>;

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
      SET channel = @channel, enabled = TRUE
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
      INSERT OR IGNORE INTO markov_chain_sentences (id, text, timestamp, markov_chain_id) 
      VALUES (@id, @text, @timestamp, @chainId)
    `);

    this.stmtDisable = this.connection.database.prepare(
      'UPDATE markov_chain SET enabled = FALSE WHERE id = @id'
    );

    this.stmtDeleteAllSentences = this.connection.database.prepare(
      'DELETE FROM markov_chain_sentences WHERE markov_chain_id = @id'
    );

    this.stmtFindMarkovByGuild = this.connection.database.prepare(
      'SELECT * FROM markov_chain WHERE guild = @guild'
    );

    this.stmtGetAllSentences = this.connection.database.prepare(`
      SELECT * FROM markov_chain_sentences 
      WHERE markov_chain_id = @chainId
      ORDER BY timestamp ASC
      LIMIT @limit
    `);

    this.stmtGetAllPendingEnabled = this.connection.database.prepare(`
      SELECT * FROM markov_chain markov
      WHERE enabled IS TRUE AND (
        SELECT COUNT(1) FROM markov_chain_sentences
        WHERE markov_chain_id = markov.id
      ) < @limit
    `);

    this.stmtGetFirstMessage = this.connection.database.prepare(`
      SELECT id FROM markov_chain_sentences
      WHERE markov_chain_id = @chainId
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
  }

  public getGuildPending(limit: number): MarkovChain[] {
    return this.stmtGetAllPendingEnabled.all({ limit });
  }

  public getFirstMessage(chainId: number): string | undefined {
    return this.stmtGetFirstMessage.pluck().get({ chainId }) || undefined;
  }

  public pushSentences(chainId: number, limit: number, sentences: MarkovChainSentence[]): void {
    if (!sentences.length) return;

    const writeSentences = this.connection.database.transaction((s: MarkovChainSentence[]) => {
      s.forEach((x) =>
        this.stmtInsertSentence.run({
          chainId,
          id: x.id!,
          text: x.text,
          timestamp: x.timestamp,
        })
      );
      this.stmtDeleteSentences.run({ chainId, limit });
    });

    writeSentences(sentences);
  }

  public getSentences(chainId: number, limit: number): MarkovChainSentence[] {
    return this.stmtGetAllSentences.all({ chainId, limit });
  }

  public toggleMarkovFor(guild: string, channel: string): boolean {
    const markov = this.getMarkovForGuild(guild);

    if (!markov || !markov.enabled) {
      this.stmtEnable.run({ guild, channel });
      return true;
    } else {
      this.stmtDisable.run({ id: markov.id });
      this.stmtDeleteAllSentences.run({ id: markov.id });
      this.cache.delete(guild);
      return false;
    }
  }

  public getMarkovForGuild(guild: string): MarkovChain | undefined {
    if (this.cache.has(guild)) return this.cache.get(guild);
    const value: MarkovChain = this.stmtFindMarkovByGuild.get({ guild });
    if (value) this.cache.set(guild, value);
    return value;
  }
}
