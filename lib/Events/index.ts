import { Client, Message } from 'discord.js';

import { markovMessage as markovMessageEvent } from './MarkovMessage';
import { markovReady as markovReadyEvent } from './MarkovReady';
import { message as messageEvent } from './Message';
import { ready as readyEvent } from './Ready';

export function bootstrap(client: Client): void {
  client.once('ready', () => {
    readyEvent();
    markovReadyEvent(client);
  });

  client.on('message', (message: Message) => {
    const userId = message?.author?.id;
    const clientId = message?.client?.user?.id;

    if ((userId && clientId == userId) || !message.guild) {
      return;
    }

    messageEvent(message);
    markovMessageEvent(message);
  });
}
