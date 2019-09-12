import { injectable, inject } from 'tsyringex'
import { VoiceChannel, VoiceConnection } from 'discord.js'
import { PlayerQueue } from './PlayerQueue'
import { Playable } from './Playable'
import { Parser } from './Parser'

@injectable()
export class Player {
  /**
   * The voice channel the bot is currently connected to
   */
  public voiceChannel?: VoiceChannel
  /**
   * The current voice connection the bot is streaming to
   */
  public voiceConnection?: VoiceConnection

  public constructor(
    /**
     * The current player queue
     */
    @inject(PlayerQueue) protected readonly queue: PlayerQueue,
    /**
     * URL parser
     */
    @inject(Parser) protected readonly parser: Parser
  ) {
    this.queue.on('playable', () => this.play())
  }

  public queuePlayable(channel: VoiceChannel, playable: Playable, times: number): void {
    this.voiceChannel = this.voiceChannel || channel
    Array(times)
      .fill(null)
      .forEach(() => this.queue.push(playable))
  }

  private play(): void {
    this.voiceChannel!.join()
      .then((connection) => (this.voiceConnection = connection))
      .then(() => this.playNext())
      .catch(console.log)
  }

  private async playNext(): Promise<void> {
    const next = this.queue.pop()
    if (!next) {
      return
    }
    const actualUrl = await this.parser.parse(next.uri)
    this.voiceConnection!.play(actualUrl.uri).once('end', () => this.playNext())
  }
}
