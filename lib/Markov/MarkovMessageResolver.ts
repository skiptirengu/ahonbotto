import { Guild, Message, TextChannel } from 'discord.js';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from 'winston';

import { MarkovChain, MarkovChainSentence } from '../Storage/Models/Markov';
import { MarkovMessageSanitizer } from './MarkovMessageSanitizer';
import { SynchronizedSentenceSource } from './SynchronizedSentenceSource';

@scoped(Lifecycle.ContainerScoped)
export class MarkovMessageResolver {
  private isRunning = false;

  public constructor(
    @inject(Guild)
    private readonly guild: Guild,
    @inject(MarkovMessageSanitizer)
    private readonly sanitizer: MarkovMessageSanitizer,
    @inject(SynchronizedSentenceSource)
    private readonly sentenceSource: SynchronizedSentenceSource,
    @inject('Logger')
    private readonly logger: Logger
  ) {}

  public async resolveMessages(
    markov: MarkovChain,
    firstMessage: string | undefined,
    limit: number
  ): Promise<any> {
    if (this.isRunning) return;
    this.logger.info('importing messages from discord', { firstMessage, limit });
    this.isRunning = true;
    const channel = this.guild.channels.resolve(markov.channel) as TextChannel;
    let messageCount = 0;
    for await (const bulk of this.fetchMessages(channel, firstMessage, limit)) {
      messageCount += this.sentenceSource.pushSentences(markov.id, this.mapMessages(bulk));
    }
    this.logger.info('finished importing messages from discord', { messageCount });
    this.isRunning = false;
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

  private async *fetchMessages(
    channel: TextChannel,
    before: string | undefined,
    limit: number
  ): AsyncGenerator<Message[], any, any> {
    let fetchedCount = 0;
    while (fetchedCount < limit) {
      const filter = before ? { before } : undefined;
      this.logger.verbose('received message bulk', { before, fetchedCount });
      const result = await channel.messages.fetch(filter, false);
      result.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      if (result.size) {
        before = result.first()!.id;
        const messages = this.sanitizer.sanitize(result.array());
        fetchedCount += messages.length;
        yield messages;
      }
    }
  }
}
