import { inject, Lifecycle, scoped } from 'tsyringe';

import { Config } from '../Config';
import { MarkovChainRepository } from '../Storage/MarkovChainRepository';
import { MarkovChainSentence } from '../Storage/Models/Markov';

interface FlushBatch {
  start: number;
  count: number;
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
    private readonly config: Config
  ) {
    this.markovSentenceCacheSize = this.config.markovSentenceCacheSize;
    this.flushTimeout = setInterval(() => this.flushMessages(), 10000);
  }

  public warmUpCache(chainId: number): void {
    if (this.cachedWarmedUp) return;
    this.cachedSentences.push(
      ...this.repository.getSentences(chainId, this.markovSentenceCacheSize)
    );
    this.cachedWarmedUp = true;
  }

  public isReady(): boolean {
    return this.cachedSentences.length >= this.markovSentenceCacheSize;
  }

  public getRamainingCount(): number {
    return this.markovSentenceCacheSize - this.cachedSentences.length;
  }

  public pushSentences(chainId: number, sentences: MarkovChainSentence[]): void {
    const length = this.cachedSentences.unshift(...sentences);
    this.cachedSentences.splice(this.markovSentenceCacheSize - 1);
    this.flushBatch.push({
      start: length === 1 ? 0 : length - sentences.length,
      count: sentences.length,
      chain: chainId,
    });
  }

  public getSentences(): MarkovChainSentence[] {
    return this.cachedSentences;
  }

  public clearTimeout(): void {
    clearTimeout(this.flushTimeout);
  }

  private flushMessages(): void {
    this.flushBatch.forEach((x) =>
      this.repository.pushSentences(
        x.chain,
        this.markovSentenceCacheSize,
        this.cachedSentences.slice(x.start, x.count - 1)
      )
    );
    this.flushBatch.splice(0);
  }
}
