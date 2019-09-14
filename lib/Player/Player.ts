import { inject, scoped } from 'tsyringex'
import { VoiceChannel, VoiceConnection, StreamDispatcher, Guild } from 'discord.js'
import { PlayerQueue } from './PlayerQueue'
import { Playable } from './Playable'
import { UrlParser } from './UrlParser'
import { create } from './Handlers/HandlerFactory'

@scoped()
export class Player {
  /**
   * The voice channel the bot is currently connected to
   */
  protected voiceChannel?: VoiceChannel
  /**
   * The current voice connection the bot is streaming to
   */
  protected voiceConnection?: VoiceConnection
  /**
   * Current playable
   */
  protected current?: Playable
  /**
   * Current stream dispatcher
   */
  protected dispatcher?: StreamDispatcher

  public constructor(
    /**
     * The current player queue
     */
    @inject(PlayerQueue) protected readonly queue: PlayerQueue,
    /**
     * URL parser
     */
    @inject(UrlParser) protected readonly parser: UrlParser,
    /**
     * Current guild
     */
    @inject(Guild) protected readonly guild: Guild
  ) {
    this.queue.on('playable', () => this.startPlaying())
  }

  public push(channel: VoiceChannel, playable: Playable, times: number): void {
    this.voiceChannel = this.voiceChannel || channel
    Array(times)
      .fill(undefined)
      .forEach(() => this.queue.push(playable))
  }

  public stop(): void {
    this.queue.clear()
    this.disconnect()
  }

  public next(): void {
    if (this.dispatcher) this.dispatcher.end()
  }

  private startPlaying(): void {
    if (this.current) return

    this.voiceChannel!.join()
      .then((connection) => (this.voiceConnection = connection))
      .then(() => this.playNext())
      .catch(console.error)
  }

  private async playNext(): Promise<void> {
    this.current = this.queue.pop()

    if (!this.current) {
      this.disconnect()
      return
    }

    const handler = await create(this.current.uri, this.guild)
    const readable = await handler.stream()

    this.dispatcher = this.voiceConnection!.play(readable)
      .once('unpipe', () => this.playNext())
      .on('error', (err) => console.error('error dispatcher', err))
  }

  private disconnect(): void {
    // Stop handler first if it still playing
    this.clearCurrentHandler()
    // Set the current voice channel to undefined
    this.clearVoiceChannel()
    // And dispose the voice connection
    this.disconnectVoiceConnection()
  }

  private clearCurrentHandler(): void {
    if (this.dispatcher) {
      this.dispatcher.destroy()
      this.dispatcher = undefined
    }
  }

  private clearVoiceChannel(): void {
    if (this.voiceChannel) this.voiceChannel = undefined
  }

  private disconnectVoiceConnection(): void {
    if (this.voiceConnection) {
      this.voiceConnection.disconnect()
      this.voiceConnection = undefined
    }
  }
}
