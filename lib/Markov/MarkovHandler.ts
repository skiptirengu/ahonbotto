import dayjs from 'dayjs';
import { Message } from 'discord.js';
import { TextGenerator } from 'node-markov-generator';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from 'winston';

import { Config } from '../Config';
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
    public readonly repository: MarkovChainRepository,
    @inject('Logger')
    private readonly logger: Logger,
    @inject('Config') protected readonly config: Config
  ) {}

  public get(guild: string): MarkovChain | undefined {
    return this.repository.getMarkovForGuild(guild);
  }

  public pushMessages(chain: number, messages: Message[]): void {
    this.sentenceSource.pushSentences(chain, this.mapMessages(messages));
    this.increaseProbability(messages.length);
  }

  public generateSentence(): string {
    const sentences = this.sentenceSource.getSentences().map((x) => x.text);
    const generator = new TextGenerator(sentences);
    return generator.generateSentence({
      minWordCount: this.config.markovMinLength,
      maxWordCount: this.config.markovMaxLength,
    });
  }

  public shouldGenerateSentence(): boolean {
    if (!this.sentenceSource.isReady()) {
      this.logger.debug('source is not ready', {
        count: this.sentenceSource.getSentences().length,
      });
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
    this.logger.debug('response chance', {
      randomChance,
      probability: this.responseProbability,
    });
    if (this.responseProbability >= randomChance) {
      this.resetProbability();
      return true;
    }

    return false;
  }

  public resetProbability(): void {
    this.responseProbability = 0;
  }

  public increaseProbability(count = 1): void {
    const [start, end] = this.config.markovProbabilityIncrease;
    this.responseProbability += Array(count)
      .fill(0)
      .map(() => numberInRage(start, end))
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
