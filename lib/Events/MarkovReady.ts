import { Client } from 'discord.js';
import { Logger } from 'winston';

import { Config } from '../Config';
import { container, scopeFactory } from '../Container';
import { SynchronizedSentenceSource } from '../Markov';
import { MarkovMessageResolver } from '../Markov/MarkovMessageResolver';
import { MarkovChainRepository } from '../Storage/MarkovChainRepository';

export const markovReady = (client: Client): void => {
  const markovRepository = container.resolve(MarkovChainRepository);
  const config = container.resolve<Config>('Config');
  const pending = markovRepository.getGuildPending(config.markovSentenceCacheSize);
  const promises = pending.map(async (markov) => {
    const guild = client.guilds.resolve(markov.guild);
    if (!guild) throw new Error(`Guild ${markov.guild} does not exist`);

    const scope = scopeFactory(guild);
    const logger = scope.resolve<Logger>('Logger');
    const messageSource = scope.resolve(SynchronizedSentenceSource);
    logger.info('warming up cache for guild', { id: guild.id, name: guild.name });
    messageSource.warmUpCache(markov.id);

    const resolver = scope.resolve(MarkovMessageResolver);
    const firstMessage = markovRepository.getFirstMessage(markov.id);
    const limit = messageSource.getRamainingCount();
    logger.info('not enough cached messages: importing from discord', { count: limit });
    await resolver.resolveMessages(markov, firstMessage, limit);
  });

  const logger = container.resolve<Logger>('Logger');

  Promise.all(promises)
    .then(() =>
      logger.info('succesfully imported all messages for all guilds', { count: promises.length })
    )
    .catch((err: Error) => {
      logger.error('failed to import messages from one or more guilds', err);
    });
};
