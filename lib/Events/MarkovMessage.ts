import { Message } from 'discord.js';

import { scopeFactory } from '../Container';
import { MarkovHandler } from '../Markov';
import { MarkovMessageSanitizer } from '../Markov/MarkovMessageSanitizer';

export function markovMessage(message: Message): void {
  const container = scopeFactory(message.guild!);
  const handler = container.resolve(MarkovHandler);
  const sanitizer = container.resolve(MarkovMessageSanitizer);

  const markov = handler.get(message.guild!.id);
  if (!markov?.enabled) return;

  handler.sentenceSource.warmUpCache(markov.id);

  if (!sanitizer.sanitize([message]).length) {
    handler.increaseProbability();
  } else {
    handler.pushMessages(markov.id, [message]);
  }

  if (handler.shouldGenerateSentence()) {
    message.reply('Teste');
  }
}
