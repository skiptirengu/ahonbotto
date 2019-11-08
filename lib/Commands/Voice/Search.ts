import { Message, MessageEmbedOptions } from 'discord.js'
import { inject, scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'
import { URL } from 'url'
import youtubeSearch from 'youtube-search'

import { Config } from '../../Config'
import { Playable } from '../../Player/Playable'
import { SearchRepository } from '../../Player/SearchRepository'
import { embed } from '../../Util'
import { Command, CommandDefinition, CommandType } from '../Command'

@scoped(Lifecycle.ContainerScoped, 'CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Voice
  /**
   * @inheritdoc
   */
  command = 'Search'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      title: '<query...>',
      description:
        'Search a video on youtube and prints the top entries. See also **select** command.',
      fields: [{ name: 'Example:', value: '`!search open the tcheka`', inline: true }]
    }
  }
}

@scoped(Lifecycle.ContainerScoped, 'Search')
export class Search implements Command {
  public constructor(
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config,
    /**
     * Repository containing search results
     */
    @inject(SearchRepository) protected readonly repository: SearchRepository
  ) {}

  public async run(message: Message, params: string[]): Promise<Message | Message[]> {
    const queryString = params.join(' ')

    const response = await youtubeSearch(queryString, {
      key: this.config.youtubeToken,
      maxResults: 6,
      safeSearch: 'none',
      videoSyndicated: 'true',
      type: 'video'
    })

    if (!response.results.length) {
      return message.channel.send(
        embed({
          description: "Couldn't find what you're looking for :/"
        })
      )
    }

    const storageKey = this.buildKey(message)
    const results = response.results.map(
      (value): Playable => ({ name: value.title, uri: new URL(value.link), isLocal: false })
    )

    this.repository.push(storageKey, results)

    const description = response.results
      .map((value, index) => `**${index + 1}** →  ${value.title}`)
      .join('\n\n')

    return message.channel.send(
      embed({
        description
      })
    )
  }

  protected buildKey(message: Message): string {
    return `Guild:${message.guild!.id}|User:${message.author!.id}`
  }
}
