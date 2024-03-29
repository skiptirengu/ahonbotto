import dayjs from 'dayjs';
import { APIEmbed, EmbedField } from 'discord.js';

import { Playable } from '../Player/Playable';
import { PlayerOptions } from '../Player/PlayerOptions';
import { getConfig } from './command';

export function buildPlayableInfo(
  current: Playable,
  options: PlayerOptions,
  streamingTime?: number
): APIEmbed {
  const fields: EmbedField[] = [];
  const messageEmbed: APIEmbed = {
    title: current!.name,
    color: getConfig().embedColor,
  };

  if (current!.totalTime && current!.totalTime > 0) {
    fields.push({ name: 'Length', value: getHumanizedTimeInfo(current!.totalTime), inline: true });
  }
  if (!current!.isLocal && streamingTime != undefined && streamingTime > 0) {
    fields.push({
      name: 'Playing for',
      value: getHumanizedTimeInfo(streamingTime / 1000) || 'Just started',
      inline: true,
    });
  }
  if (options.times) {
    messageEmbed.description = `Repeating ${options.times} time(s)`;
  }
  if (!current!.isLocal) {
    messageEmbed.url = current!.uri.href;
    fields.push({
      name: 'Auto play',
      value: options.autoPlay ? 'enabled' : 'disabled',
      inline: true,
    });
  }
  if (current!.thumbnail) {
    messageEmbed.thumbnail = { url: current!.thumbnail };
  }

  return { ...messageEmbed, fields };
}

export function getHumanizedTimeInfo(secs: number): string {
  const timeString: string[] = [];
  const timeInfo = dayjs().startOf('day').add(secs, 'second');

  if (timeInfo.hour() > 0) {
    timeString.push(`${timeInfo.hour()} hour(s)`);
  }
  if (timeInfo.minute() > 0) {
    timeString.push(`${timeInfo.minute()} minute(s)`);
  }
  if (timeInfo.second() > 0) {
    timeString.push(`${timeInfo.second()} second(s)`);
  }

  return timeString.join(', ');
}
