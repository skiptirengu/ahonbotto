import { Message } from 'discord.js';
import { injectable } from 'tsyringe';

import { MarkovChainRepository } from '../Storage/MarkovChainRepository';
import { MarkovChainSentence } from '../Storage/Models/Markov';

@injectable()
export class SynchronizedSentenceSource {
  private readonly cachedSentences: MarkovChainSentence[] = [];
  private readonly markovSentenceCacheSize: number = 3000;

  public constructor(private readonly repository: MarkovChainRepository) {}

  public pushSentences(chainId: number, messages: Message[]): void {
    // (x + ((y - x + 1) * crypto.randomFillSync(new Uint32Array(1))[0]) / 2 ** 32) | 0;
    const sentences = this.mapMessages(messages);
    this.cachedSentences.unshift(...sentences);
    this.cachedSentences.splice(this.markovSentenceCacheSize - 1);
    this.repository.pushSentences(chainId, this.markovSentenceCacheSize, sentences);
  }

  public getSentences(): MarkovChainSentence[] {
    return this.cachedSentences;
  }

  private mapMessages(messages: Message[]): MarkovChainSentence[] {
    return messages.map(
      (message): MarkovChainSentence => ({
        id: message.id,
        text: message.content,
        timestamp: message.createdTimestamp,
      })
    );
  }
}
