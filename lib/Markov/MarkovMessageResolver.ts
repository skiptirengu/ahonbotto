import { Guild, Message, TextChannel } from 'discord.js';
import { inject, Lifecycle, scoped } from 'tsyringe';

import { MarkovChain, MarkovChainSentence } from '../Storage/Models/Markov';
import { MarkovMessageSanitizer } from './MarkovMessageSanitizer';
import { SynchronizedSentenceSource } from './SynchronizedSentenceSource';

@scoped(Lifecycle.ContainerScoped)
export class MarkovMessageResolver {
  public constructor(
    @inject(Guild)
    private readonly guild: Guild,
    @inject(MarkovMessageSanitizer)
    private readonly sanitizer: MarkovMessageSanitizer,
    @inject(SynchronizedSentenceSource)
    private readonly sentenceSource: SynchronizedSentenceSource
  ) {}

  public async resolveMessages(
    markov: MarkovChain,
    firstMessage: string | undefined,
    limit: number
  ): Promise<any> {
    const channel = this.guild.channels.resolve(markov.channel) as TextChannel;
    for await (const bulk of this.fetchMessages(channel, firstMessage, limit)) {
      this.sentenceSource.pushSentences(markov.id, this.mapMessages(bulk));
    }
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
      const result = await channel.messages.fetch({ before }, false);
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
