import { Client } from 'discord.js';

import { message as messageEvent } from './Message';
import { ready as readyEvent } from './Ready';

export function bootstrap(client: Client): void {
  client.on('ready', readyEvent);
  client.on('message', messageEvent);
}
