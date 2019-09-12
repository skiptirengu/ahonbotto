import { Command, CommandType, CommandDefinition } from '..'
import { Message } from 'discord.js'
import { injectable, inject } from 'tsyringex'
import { Config } from '../../Config'
import youtubeSearch from 'youtube-search'
import { SearchRepository } from '../../Player/SearchRepository'
import { Playable } from '../../Player/Playable'

export const definition: CommandDefinition = {
  /**
   * @inheritdoc
   */
  type: CommandType.Voice,
  /**
   * @inheritdoc
   */
  command: 'Search',
  /**
   * @inheritdoc
   */
  usage: () => ({
    title: '<query...>',
    description:
      'Search a video on youtube and prints the top entries. See also **select** command.',
    fields: [{ name: 'Example:', value: '`!search open the tcheka`', inline: true }]
  })
}

@injectable()
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
      return message.channel.send("Couldn't find what you're looking for :/".codeWrap())
    }

    const storageKey = this.buildKey(message)
    const results = response.results.map(
      (value): Playable => ({ name: value.title, uri: value.link })
    )

    this.repository.push(storageKey, results)

    const responseMessage = response.results
      .map((value, index) => `${index + 1}. ${value.title}`)
      .join('\n')
      .codeWrap()

    return message.channel.send(responseMessage)
  }

  protected buildKey(message: Message): string {
    return `Guild:${message.guild!.id}|User:${message.author!.id}`
  }
}
