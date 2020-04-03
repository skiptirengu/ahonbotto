import dayjs from 'dayjs'
import { MessageEmbedOptions } from 'discord.js'

import { Playable } from '../Player/Playable'
import { getConfig } from './command'

export function buildPlayableInfo(
  current: Playable,
  streamingTime?: number,
  times?: number
): MessageEmbedOptions {
  const messageEmbed: MessageEmbedOptions = {
    title: current!.name,
    fields: [],
    color: getConfig().embedColor,
  }

  if (current!.totalTime && current!.totalTime > 0) {
    messageEmbed.fields!.push({ name: 'Length', value: getHumanizedTimeInfo(current!.totalTime) })
  }
  if (!current!.isLocal && streamingTime != undefined && streamingTime > 0) {
    messageEmbed.fields!.push({
      name: 'Playing for',
      value: getHumanizedTimeInfo(streamingTime / 1000) || 'Just started',
    })
  }
  if (typeof times === 'number' && times > 0) {
    messageEmbed.description = `Repeating ${times} time(s)`
  }
  if (!current!.isLocal) {
    messageEmbed.url = current!.uri.href
  }
  if (current!.thumbnail) {
    messageEmbed.thumbnail = { url: current!.thumbnail }
  }

  return messageEmbed
}

export function getHumanizedTimeInfo(secs: number): string {
  const timeString: string[] = []
  const timeInfo = dayjs().startOf('day').add(secs, 'second')

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
