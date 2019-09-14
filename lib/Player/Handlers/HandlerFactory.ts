import { StreamingHandler } from './StreamingHandler'
import { parse } from 'uri-js'
import { BufferedHttpStreamingHandler } from './BufferedHttpStreamingHandler'
import { Guild } from 'discord.js'

export function create(url: string, guild: Guild): Promise<StreamingHandler> {
  const uri = parse(url)

  if (!uri.scheme || !['http', 'https'].includes(uri.scheme)) {
    throw new Error(`unknown scheme ${uri.scheme}`)
  }

  return new BufferedHttpStreamingHandler().setContext(url, guild)
}
