import { Message } from 'discord.js';
import { sample } from 'lodash';
import { Logger } from 'winston';

import { scopeFactory } from '../Container';
import { MarkovHandler } from '../Markov';
import { MarkovMessageSanitizer } from '../Markov/MarkovMessageSanitizer';

export function markovMessage(message: Message): void {
  const container = scopeFactory(message.guild!);
  const logger = container.resolve<Logger>('Logger');

  try {
    const handler = container.resolve(MarkovHandler);
    const sanitizer = container.resolve(MarkovMessageSanitizer);

    const markov = handler.get(message.guild!.id);
    if (!markov?.enabled || markov.channel != message.channel.id) return;

    handler.sentenceSource.warmUpCache(markov.id);

    if (!sanitizer.sanitize([message]).length) {
      handler.increaseProbability();
      return;
    }

    handler.pushMessages(markov.id, [message]);

    if (handler.shouldGenerateSentence()) {
      const firstWord = sample(message.content.split(' '));
      const sentence = handler.generateSentence(firstWord);
      message.channel.send(sentence).catch((error) => logger.error('markov send error', { error }));
    }
  } catch (error) {
    logger.error('markov error', { error });
  }
}
