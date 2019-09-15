import { Message, MessageEmbedOptions } from 'discord.js'
import { scoped, inject } from 'tsyringex'
import { Player } from '../../Player/Player'
import { CommandDefinition, CommandType, Command } from '../Command'
import dayjs from 'dayjs'
import { embed } from '../../Util'
import { Config } from '../../Config'

@scoped('CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Voice
  /**
   * @inheritdoc
   */
  command = 'Playing'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      description: 'Shows information about the current playing audio'
    }
  }
}

@scoped('Playing')
export class Playing implements Command {
  public constructor(
    /**
     * All command definitions bound to the container
     */
    @inject(Player) private readonly player: Player,
    /**
     * Bot configuration object
     */
    @inject('Config') protected readonly config: Config
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: Message, params: string[]): Promise<Message> {
    const current = this.player.getCurrentPlayable()

    if (!current) {
      return message.channel.send(
        embed({
          description: "There's nothing playing at the moment"
        })
      )
    }

    const streamingTime = this.player.getStreamingTime()
    const messageEmbed: MessageEmbedOptions = {
      title: current!.name,
      fields: [],
      color: this.config.embedColor
    }

    if (current!.totalTime && current!.totalTime > 0) {
      messageEmbed.fields!.push({ name: 'Length', value: this.getTimeInfo(current!.totalTime) })
    }
    if (!current!.isLocal && streamingTime > 0) {
      messageEmbed.fields!.push({
        name: 'Playing for',
        value: this.getTimeInfo(streamingTime / 1000)
      })
    }
    if (!current!.isLocal) {
      messageEmbed.url = current!.uri
    }
    if (current!.thumbnail) {
      messageEmbed.thumbnail = { url: current!.thumbnail }
    }

    return message.channel.send({ embed: messageEmbed })
  }

  private getTimeInfo(secs: number): string {
    const timeString: string[] = []
    const timeInfo = dayjs()
      .startOf('day')
      .add(secs, 'second')

    if (timeInfo.hour() > 0) {
      timeString.push(`${timeInfo.hour()} hour(s)`)
    }
    if (timeInfo.minute() > 0) {
      timeString.push(`${timeInfo.minute()} minute(s)`)
    }
    if (timeInfo.second() > 0) {
      timeString.push(`${timeInfo.second()} second(s)`)
    }

    return timeString.join(', ')
  }
}
