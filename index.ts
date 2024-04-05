import 'reflect-metadata';
import './lib/Extensions';

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { Logger } from 'winston';

import { Config } from './lib/Config';
import { bootstrap as bootstrapContainer, container } from './lib/Container';
import { bootstrap as bootstrapEvents } from './lib/Events';
import { Scheduler } from './lib/Jobs/Scheduler';
import { PlayerCleanup } from './lib/Player/PlayerCleanup';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});
bootstrapContainer(client);
bootstrapEvents(client);
const logger = container.resolve<Logger>('Logger');

client
  .login(container.resolve<Config>('Config').discordToken)
  .then(() => Scheduler.start())
  .then(() => container.resolve(PlayerCleanup).attatch(process))
  .catch((error) => {
    logger.error('Uncaught initialization error', error);
    setTimeout(() => process.exit(1), 1250);
  });
