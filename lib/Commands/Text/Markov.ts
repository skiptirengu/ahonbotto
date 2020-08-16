import { Message, TextChannel } from 'discord.js';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from 'winston';

import { SynchronizedSentenceSource } from '../../Markov';
import { MarkovMessageResolver } from '../../Markov/MarkovMessageResolver';
import { MarkovChainRepository } from '../../Storage/MarkovChainRepository';
import { Command } from '../Command';

@scoped(Lifecycle.ContainerScoped, 'Markov')
export class Markov implements Command {
  public constructor(
    @inject(MarkovChainRepository)
    protected readonly repository: MarkovChainRepository,
    @inject('Logger')
    protected readonly logger: Logger,
    @inject(MarkovMessageResolver)
    protected readonly messageResolver: MarkovMessageResolver,
    @inject(SynchronizedSentenceSource)
    protected readonly messageSource: SynchronizedSentenceSource
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, _: string[]): Promise<any> {
    if (message.author.id !== '209871057295900673') return;
    const channel = message.channel as TextChannel;

    const enabled = this.repository.toggleMarkovFor(message.guild!.id, channel.id!);
    this.logger.info('markov state changed', { enabled });

    if (!enabled) {
      return message.reply(`Markov chain disabled for channel ${channel.name}`);
    }

    const markov = this.repository.getMarkovForGuild(message.guild!.id);
    await this.messageResolver.resolveMessages(
      markov!,
      undefined,
      this.messageSource.getRamainingCount()
    );

    return message.reply(`Markov chain enabled for channel ${channel.name}`);
  }
}
