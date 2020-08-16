import dayjs from 'dayjs';
import { Message } from 'discord.js';
import inRage from 'lodash/inRange';
import { inject, Lifecycle, scoped } from 'tsyringe';

import { MarkovChainRepository } from '../Storage/MarkovChainRepository';
import { MarkovChain, MarkovChainSentence } from '../Storage/Models/Markov';
import { numberInRage } from '../Util/random';
import { SynchronizedSentenceSource } from './SynchronizedSentenceSource';

@scoped(Lifecycle.ContainerScoped)
export class MarkovHandler {
  private responseProbability = 0;
  private lastFourTwenty: dayjs.Dayjs | undefined = undefined;

  public constructor(
    @inject(SynchronizedSentenceSource)
    public readonly sentenceSource: SynchronizedSentenceSource,
    @inject(MarkovChainRepository)
    public readonly repository: MarkovChainRepository
  ) {}

  public get(guild: string): MarkovChain | undefined {
    return this.repository.getMarkovForGuild(guild);
  }

  public pushMessages(chain: number, messages: Message[]): void {
    this.sentenceSource.pushSentences(chain, this.mapMessages(messages));
    this.increaseProbability(messages.length);
  }

  // public generateSentence(): string {}

  public shouldGenerateSentence(): boolean {
    if (!this.sentenceSource.isReady()) {
      return false;
    }

    const now = dayjs.utc().add(-3, 'hour');

    if (
      now.hour() == 16 &&
      now.minute() == 20 &&
      (!this.lastFourTwenty || this.lastFourTwenty.endOf('day').isBefore(now))
    ) {
      this.lastFourTwenty = now;
      return true;
    }

    if (Math.ceil(this.responseProbability) >= 100) {
      this.resetProbability();
      return true;
    }

    const randomChance = numberInRage(1, 100);
    const threshold = parseFloat('04:20'.replace(':', '.'));
    if (inRage(this.responseProbability, randomChance - threshold, randomChance + threshold)) {
      this.resetProbability();
      return true;
    }

    return false;
  }

  public resetProbability(): void {
    this.responseProbability = 0;
  }

  public increaseProbability(count = 1): void {
    this.responseProbability = Array(count)
      .fill(0)
      .map(() => numberInRage(0.5, 1.5))
      .reduce((prev, next) => prev + next);
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
