import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnection,
} from '@discordjs/voice';
import { Guild, VoiceBasedChannel } from 'discord.js';
import { shuffle } from 'lodash';
import { inject, scoped } from 'tsyringe';
import { Lifecycle } from 'tsyringe';
import { Logger } from 'winston';

import { TOKENS } from '../Container/tokens';
import { HandlerFactory } from './Handlers/HandlerFactory';
import { AutoParser } from './Parser/AutoParser';
import { Playable } from './Playable';
import { PlayerOptions } from './PlayerOptions';
import { PlayerQueue } from './PlayerQueue';

@scoped(Lifecycle.ContainerScoped)
export class Player {
  /**
   * The voice channel the bot is currently connected to
   */
  protected voiceChannel?: VoiceBasedChannel;
  /**
   * The current voice connection the bot is streaming to
   */
  protected voiceConnection?: VoiceConnection;
  /**
   * Current playable
   */
  protected current?: Playable;
  /**
   * Current stream dispatcher
   */
  protected player?: AudioPlayer;
  /**
   * Whether or not to automatically queue related videos once the queue is empty
   */
  protected autoPlay = false;

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
    @inject(TOKENS.Guild) protected readonly guild: Guild,
    /**
     * Scoped dependency container
     */
    @inject(HandlerFactory) protected readonly factory: HandlerFactory,
    /**
     * Scoped logger
     */
    @inject('Logger') protected readonly logger: Logger
  ) {
    this.queue.on('playable', () => this.startPlaying());
  }

  public togglePlayingState(): void {
    if (!this.current || this.current.isLocal || !this.player) return;

    if (this.player.state.status === AudioPlayerStatus.Playing) {
      this.player.pause(true);
    } else {
      this.player.unpause();
    }
  }

  public getStreamingTime(): number {
    // return (this.player && this.player.streamTime) || 0;
    return 0;
  }

  public getCurrentPlayable(): Playable | undefined {
    return this.current;
  }

  public push(
    channel: VoiceBasedChannel,
    playable: Playable | Playable[],
    options: PlayerOptions
  ): void {
    this.voiceChannel = this.voiceChannel || channel;

    if (Array.isArray(playable) && options.shuffle) {
      shuffle(playable).forEach((x) => this.queue.push(x));
    } else if (Array.isArray(playable)) {
      playable.reverse().forEach((x) => this.queue.push(x));
    } else {
      Array(options.times)
        .fill(null)
        .forEach(() => this.queue.push(playable));
    }

    this.autoPlay = options.autoPlay !== null ? options.autoPlay : this.autoPlay;
  }

  public stop(): void {
    this.queue.clear();
    this.disconnect();
  }

  public next(): void {
    if (this.player) this.player.stop();
  }

  public setAutoPlay(arg: boolean): void {
    if (this.current) this.autoPlay = arg;
  }

  public getAutoPlay(): boolean {
    return this.autoPlay;
  }

  public isQueueEmpty(): boolean {
    return this.queue.empty();
  }

  private startPlaying(): void {
    if (this.current) return;

    this.voiceConnection = joinVoiceChannel({
      guildId: this.voiceChannel!.guild.id,
      channelId: this.voiceChannel!.id,
      adapterCreator: this.voiceChannel!.guild.voiceAdapterCreator,
    });

    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    this.playNext();
  }

  private async playNext(): Promise<void> {
    this.current = this.queue.shift();

    if (!this.current) {
      this.disconnect();
      return;
    }

    try {
      const handler = await this.factory.create(this.current);
      const stream = await handler.stream();

      this.current = handler.getPlayable();

      const source = createAudioResource(stream, {
        inlineVolume: !!this.current!.volume,
        inputType: this.current!.streamType || StreamType.Arbitrary,
      });

      if (this.current!.volume) {
        source.volume?.setVolume(this.current!.volume);
      }

      this.player!.play(source);
      this.player!.once('error', (error) => this.logger.error('Stream dispatcher error', error));

      this.voiceConnection!.subscribe(this.player!);

      this.player?.on(AudioPlayerStatus.Idle, () => {
        this.handleAutoPlay();
        this.playNext();
        stream.destroy();
      });
    } catch (error) {
      this.logger.error('Unable to start stream', { playable: this.current, error });
      this.playNext();
    }
  }

  private handleAutoPlay(): void {
    if (!this.isQueueEmpty() || !this.autoPlay || !this.current || this.current.isLocal) return;

    if (!this.current.isLocal && !this.current?.related) {
      this.logger.warn('Autoplay is enabled but playable does not have any related videos', {
        playable: this.current,
      });
    }

    const threshold = this.current!.totalTime! * 0.5;

    let related = this.current!.related!.filter(
      (x) => x.totalTime! < this.current!.totalTime! + threshold
    );

    if (!related.length) {
      related = this.current!.related!;
    }

    related = shuffle(related);

    this.queue.push(related.shift()!);
  }

  private disconnect(): void {
    this.current = undefined;
    // Reset autplay status
    this.autoPlay = false;
    // Stop handler first if it still playing
    this.clearCurrentHandler();
    // Set the current voice channel to undefined
    this.clearVoiceChannel();
    // And dispose the voice connection
    this.disconnectVoiceConnection();
  }

  private clearCurrentHandler(): void {
    if (this.player) {
      this.player.stop();
      this.player = undefined;
    }
  }

  private clearVoiceChannel(): void {
    if (this.voiceChannel) this.voiceChannel = undefined;
  }

  private disconnectVoiceConnection(): void {
    if (this.voiceConnection) {
      this.voiceConnection.destroy();
      this.voiceConnection = undefined;
    }
  }
}
