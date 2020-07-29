import { Message, MessageEmbedOptions } from 'discord.js'
import { inject, scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'
import wiki from 'wikijs'

import { Config } from '../../Config'
import { embed, withCommandPrefix } from '../../Util'
import { Command, CommandDefinition, CommandType } from '../Command'

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text
  /**
   * @inheritdoc
   */
  command = 'Wiki'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: 'Search something on Wikipedia',
      fields: [
        {
          name: 'Example:',
          value: `\`${withCommandPrefix('wiki')} Luiz Inácio Lula da Silva\``,
          inline: true,
        },
      ],
    }
  }
}

@scoped(Lifecycle.ContainerScoped, 'Wiki')
export class Wiki implements Command {
  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<void> {
    try {
      const term = params.join(' ')
      const page = await wiki().page(term)

      const messageEmbed = embed({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        url: await page.url(),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        title: this.getPageTitle(page.raw.title || term),
        description: this.getContent(await page.summary()),
        thumbnail: {
          url: await page.mainImage(),
        },
      })

      await message.reply("Here's your wikipedia link", messageEmbed)
    } catch (err) {
      await message.reply(
        'Sorry',
        embed({
          description: "I'm having a hard time searching for what you're looking for ( ´•︵•` )",
        })
      )
      throw err
    } finally {
      await message.delete()
    }
  }

  public getContent(input: string): string {
    return this.sliceAddMore(input, 1000)
  }

  public getPageTitle(input: string): string {
    return this.sliceAddMore(input, 256)
  }

  public sliceAddMore(input: string, max: number): string {
    const readMore = '...'

    if (!input) {
      throw new Error('empty string')
    } else if (input.length > max) {
      return input
        .slice(0, max - readMore.length)
        .trim()
        .concat('...')
    } else {
      return input
    }
  }
}
