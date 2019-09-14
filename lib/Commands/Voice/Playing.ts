import { Command, CommandType, CommandDefinition } from '..'
import { Message, MessageEmbedOptions } from 'discord.js'
import { scoped, inject } from 'tsyringex'
import { Player } from '../../Player/Player'
import dayjs = require('dayjs')

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
    @inject(Player) private readonly player: Player
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: Message, params: string[]): Promise<Message> {
    const current = this.player.getCurrentPlayable()

    if (!current) message.channel.send("There's nothing playing at the moment".codeWrap())

    const time = this.player.getStreamingTime()
    const embed: MessageEmbedOptions = {
      title: current!.name,
      fields: []
    }

    if (current!.totalTime && current!.totalTime > 0) {
      embed.fields!.push({ name: 'Length', value: this.getTimeInfo(current!.totalTime) })
    }
    if (!current!.isLocal && time > 0) {
      embed.fields!.push({ name: 'Playing for', value: this.getTimeInfo(time / 1000) })
    }
    if (!current!.isLocal) {
      embed.url = current!.uri
    }
    if (current!.thumbnail) {
      embed.thumbnail = { url: current!.thumbnail }
    }

    return message.channel.send({ embed })
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
