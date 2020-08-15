import { Message, MessageEmbedOptions } from 'discord.js';
import { Lifecycle, scoped } from 'tsyringe';

import { Command, CommandDefinition, CommandType } from '../Command.js';

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text;
  /**
   * @inheritdoc
   */
  command = 'Rola';
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: 'Rola',
    };
  }
}

@scoped(Lifecycle.ContainerScoped, 'Rola')
export class Rola implements Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<Message | Message[]> {
    const id = message.id;

    let response: string;
    if (this.repeats(id, 4)) {
      response = 'Quads do deabo!';
    } else if (this.repeats(id, 3)) {
      response = 'Triplos!';
    } else if (this.repeats(id, 2)) {
      response = 'Duplos!';
    } else {
      response = 'Num foi';
    }

    return message.reply(`${response} (${id})`);
  }

  private repeats(id: string, times: number): boolean {
    const split = id.slice(-times).split('');
    return split.every((x) => x == split[0]);
  }
}
