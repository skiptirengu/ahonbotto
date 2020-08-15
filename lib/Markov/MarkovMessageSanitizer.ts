import { Message } from 'discord.js';
import isEmpty from 'lodash/isEmpty';
import { inject, singleton } from 'tsyringe';

import { Config } from '../Config';

const hasCodeRegex = /^```.*```$/gim;

@singleton()
export class MarkovMessageSanitizer {
  public constructor(
    @inject('Config')
    private readonly config: Config
  ) {}

  /**
   * Remove unwanted messages
   * @param messages
   */
  public sanitize(messages: Message[]): Message[] {
    return messages.filter((message) => {
      return (
        !hasCodeRegex.exec(message.content) &&
        !message.embeds.length &&
        !isEmpty(message?.content) &&
        !this.config.commandPrefixes.some((x) => message?.content?.startsWith(x))
      );
    });
  }
}
