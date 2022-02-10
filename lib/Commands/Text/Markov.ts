import { Message, TextChannel } from 'discord.js';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from 'winston';

import { Config } from '../../Config';
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
    protected readonly messageSource: SynchronizedSentenceSource,
    @inject('Config') protected readonly config: Config
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, _: string[]): Promise<any> {
    const author = `${message.author.username}#${message.author.discriminator}`;
    if (author !== this.config.rootUser) return;

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
