import { Guild, StreamDispatcher, StreamOptions, VoiceChannel, VoiceConnection } from 'discord.js'
import { inject, scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'
import { Logger } from 'winston'

import { anyOnce } from '../Util'
import { HandlerFactory } from './Handlers/HandlerFactory'
import { AutoParser } from './Parser/AutoParser'
import { Playable } from './Playable'
import { PlayerQueue } from './PlayerQueue'

@scoped(Lifecycle.ContainerScoped)
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
    @inject(AutoParser) protected readonly parser: AutoParser,
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

  public togglePlayingState(): void {
    if (!this.current || this.current.isLocal || !this.dispatcher) return

    if (!this.dispatcher.paused) {
      this.dispatcher.pause(true)
    } else {
      this.dispatcher.resume()
    }
  }

  public getStreamingTime(): number {
    return (this.dispatcher && this.dispatcher.streamTime) || 0
  }

  public getCurrentPlayable(): Playable | undefined {
    return this.current
  }

  public pushAll(channel: VoiceChannel, playables: Playable[]): void {
    this.voiceChannel = this.voiceChannel || channel
    playables.reverse().forEach((playable) => this.queue.push(playable))
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
      .then(async () => this.playNext())
      .catch((error) => this.logger.error('Error starting voice connection', { error }))
  }

  private async playNext(): Promise<void> {
    this.current = this.queue.shift()

    if (!this.current) {
      this.disconnect()
      return
    }

    try {
      const handler = await this.factory.create(this.current)
      const stream = await handler.stream()

      this.current = handler.getPlayable()
      const streamOptions: StreamOptions = {
        volume: this.current!.volume || false,
        type: this.current!.streamType || 'unknown'
      }

      this.dispatcher = this.voiceConnection!.play(stream, streamOptions).once('error', (error) =>
        this.logger.error('Stream dispatcher error', { error })
      )

      anyOnce(this.dispatcher, ['end', 'finish', 'close'], () => {
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
