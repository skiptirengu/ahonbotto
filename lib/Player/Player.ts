import { Guild, StreamDispatcher, StreamOptions, VoiceChannel, VoiceConnection } from 'discord.js'
import { shuffle } from 'lodash'
import { inject, scoped } from 'tsyringe'
import { Lifecycle } from 'tsyringe'
import { Logger } from 'winston'

import { anyOnce } from '../Util'
import { HandlerFactory } from './Handlers/HandlerFactory'
import { AutoParser } from './Parser/AutoParser'
import { Playable } from './Playable'
import { PlayerOptions } from './PlayerOptions'
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
  /**
   * Whether or not to automatically queue related videos once the queue is empty
   */
  protected autoPlay = false

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

  public push(
    channel: VoiceChannel,
    playable: Playable | Playable[],
    options: PlayerOptions
  ): void {
    this.voiceChannel = this.voiceChannel || channel

    if (Array.isArray(playable) && options.shuffle) {
      shuffle(playable).forEach((x) => this.queue.push(x))
    } else if (Array.isArray(playable)) {
      playable.reverse().forEach((x) => this.queue.push(x))
    } else {
      Array(options.times)
        .fill(null)
        .forEach(() => this.queue.push(playable))
    }

    this.autoPlay = options.autoPlay
  }

  public stop(): void {
    this.queue.clear()
    this.disconnect()
  }

  public next(): void {
    if (this.dispatcher) this.dispatcher.end()
  }

  public setAutoPlay(arg: boolean): void {
    if (this.current) this.autoPlay = arg
  }

  public getAutoPlay(): boolean {
    return this.autoPlay
  }

  public isEmptyQueue(): boolean {
    return this.queue.empty()
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
        type: this.current!.streamType || 'unknown',
      }

      this.dispatcher = this.voiceConnection!.play(stream, streamOptions).once('error', (error) =>
        this.logger.error('Stream dispatcher error', { error })
      )

      anyOnce(this.dispatcher, ['end', 'finish', 'close'], () => {
        this.handleAutoPlay()
        this.playNext()
        stream.destroy()
      })
    } catch (error) {
      this.logger.error('Unable to start stream', { playable: this.current, error })
      this.playNext()
    }
  }

  private handleAutoPlay(): void {
    if (!this.autoPlay || !this.current || this.current.isLocal) return

    if (!this.current.isLocal && !this.current?.related) {
      this.logger.warn('Autoplay is enabled but playable does not have any related videos', {
        playable: this.current,
      })
    }

    const related = shuffle(this.current.related!)

    this.queue.push(related.shift()!)
  }

  private disconnect(): void {
    this.current = undefined
    // Reset autplay status
    this.autoPlay = false
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
