import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from 'winston';

import { Config } from '../Config';
import { MarkovChainRepository } from '../Storage/MarkovChainRepository';
import { MarkovChainSentence } from '../Storage/Models/Markov';

interface FlushBatch {
  value: MarkovChainSentence[];
  chain: number;
}

@scoped(Lifecycle.ContainerScoped)
export class SynchronizedSentenceSource {
  private readonly cachedSentences: MarkovChainSentence[] = [];
  private readonly markovSentenceCacheSize: number;
  private readonly flushTimeout: NodeJS.Timeout;
  private readonly flushBatch: FlushBatch[] = [];
  private cachedWarmedUp = false;

  public constructor(
    @inject(MarkovChainRepository)
    private readonly repository: MarkovChainRepository,
    @inject('Config')
    private readonly config: Config,
    @inject('Logger')
    private readonly logger: Logger
  ) {
    this.markovSentenceCacheSize = this.config.markovSentenceCacheSize;
    this.flushTimeout = setInterval(() => this.flushMessages(), 5000);
  }

  public warmUpCache(chainId: number): void {
    if (this.cachedWarmedUp) return;
    this.cachedSentences.push(
      ...this.repository.getSentences(chainId, this.markovSentenceCacheSize)
    );
    this.cachedWarmedUp = true;
    this.logger.info('cache warmed up', { size: this.cachedSentences.length });
  }

  public isReady(): boolean {
    // continue if the cache is at least 90% ready
    return this.cachedSentences.length >= this.markovSentenceCacheSize * 0.9;
  }

  public getRamainingCount(): number {
    return this.markovSentenceCacheSize - this.cachedSentences.length;
  }

  public pushSentences(chainId: number, sentences: MarkovChainSentence[]): number {
    this.cachedSentences.unshift(...sentences);
    this.cachedSentences.splice(this.markovSentenceCacheSize);
    this.flushBatch.push({
      chain: chainId,
      value: sentences,
    });
    return sentences.length;
  }

  public getSentences(): MarkovChainSentence[] {
    return this.cachedSentences;
  }

  public clearTimeout(): void {
    clearTimeout(this.flushTimeout);
  }

  private flushMessages(): void {
    try {
      if (!this.flushBatch.length) return;
      this.logger.verbose('flusing batches', { size: this.flushBatch.length });
      let flushedCount = 0;
      let totalFlushed = 0;
      for (const batch of this.flushBatch) {
        flushedCount += 1;
        this.logger.verbose('starting batch flush', {
          batchSize: batch.value.length,
          flushedCount,
        });
        this.repository.pushSentences(batch.chain, this.markovSentenceCacheSize, batch.value);
        totalFlushed += batch.value.length;
        this.logger.verbose('flushed new batch', { totalFlushed });
        if (totalFlushed >= 100) break;
      }
      this.flushBatch.splice(0, flushedCount);
    } catch (error) {
      this.logger.error('error flushing batch', { error });
    }
  }
}
