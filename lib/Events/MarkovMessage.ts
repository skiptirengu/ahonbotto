import { Message } from 'discord.js';

import { scopeFactory } from '../Container';
import { MarkovHandler } from '../Markov';

export function markovMessage(message: Message): void {
  const container = scopeFactory(message.guild!);
  const handler = container.resolve(MarkovHandler);

  let markov = handler.get(message.guild!.id);
  if (!markov?.enabled) {
    handler.repository.toggleMarkovFor(message.guild!.id, message.channel.id);
  }
  markov = handler.get(message.guild!.id)!;

  handler.sentenceSource.warmUpCache(markov.id);

  if (message.embeds.length) {
    handler.increaseProbability();
  } else {
    handler.pushMessages(markov.id, [message]);
  }

  if (handler.shouldGenerateSentence()) {
    message.reply('Teste');
  }
}
