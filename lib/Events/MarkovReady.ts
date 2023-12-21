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
    messageSource.warmUpCache(markov.id);

    const limit = messageSource.getRamainingCount();
    if (!limit) return;

    const resolver = scope.resolve(MarkovMessageResolver);
    const firstMessage = markovRepository.getFirstMessage(markov.id);
    logger.info('cached message count', { count: limit });
    await resolver.resolveMessages(markov, firstMessage, limit);
  });

  const logger = container.resolve<Logger>('Logger');

  if (!promises.length) {
    logger.info('message import not required for any guild');
    return;
  }

  Promise.all(promises)
    .then(() =>
      logger.info('succesfully imported all messages for all guilds', { count: promises.length })
    )
    .catch((error: Error) => {
      logger.error('failed to import messages from one or more guilds', error);
    });
};
