import { inject, scoped } from 'tsyringex'
import { VoiceChannel, VoiceConnection, StreamDispatcher, Guild } from 'discord.js'
import { PlayerQueue } from './PlayerQueue'
import { Playable } from './Playable'
import { UrlParser } from './UrlParser'
import { HandlerFactory } from './Handlers/HandlerFactory'
import { Logger } from 'winston'

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
    @inject(Guild) protected readonly guild: Guild,
    /**
     * Scoped dependency container
     */
    @inject(HandlerFactory) protected readonly factory: HandlerFactory,
    /**
     * Scoped logger
     */
    @inject('Logger') protected readonly logger: Logger
  ) {
    this.queue.on('playable', () => this.startPlaying())
  }

  public getStreamingTime(): number {
    return (this.dispatcher && this.dispatcher.streamTime) || 0
  }

  public getCurrentPlayable(): Playable | undefined {
    return this.current
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
      .catch((error) => this.logger.error('Error starting voice connection', { error }))
  }

  private async playNext(): Promise<void> {
    this.current = this.queue.pop()

    if (!this.current) {
      this.disconnect()
      return
    }

    try {
      const handler = await this.factory.create(this.current)
      const stream = await handler.stream()

      this.current = handler.getPlayable()
      this.dispatcher = this.voiceConnection!.play(stream)
        .once('error', (error) => this.logger.error('Stream dispatcher error', { error }))
        .once('unpipe', () => {
          this.playNext()
          stream.destroy()
        })
    } catch (error) {
      this.logger.error('Unable to start stream', { playable: this.current, error })
      this.playNext()
    }
  }

  private disconnect(): void {
    this.current = undefined
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
