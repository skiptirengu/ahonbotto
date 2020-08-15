import { toString } from 'lodash';

export interface QueueOptions {
  /**
   * Number of times to queue the song
   */
  times?: number;
  /**
   * Whether or not to shuffle the playlist
   */
  shuffle: boolean;
  /**
   * Wheter or not to enable autoplay
   */
  autoPlay: boolean | null;
}

export class PlayerOptions implements QueueOptions {
  constructor(
    /**
     * @inheritdoc
     */
    public readonly shuffle: boolean,
    /**
     * @inheritdoc
     */
    public readonly autoPlay: boolean | null,
    /**
     * @inheritdoc
     */
    public readonly times?: number
  ) {}

  public static createFromArgs(args: string[]): PlayerOptions {
    if (!args) throw new Error('Empty argument list');

    const times = args.filter((x) => !isNaN(parseInt(x))).shift();
    const shuffle = args.some((x) => toString(x).toLowerCase() === 'shuffle');
    const autoPlay = args.some((x) => toString(x).toLowerCase() === 'autoplay') || null;

    return new PlayerOptions(shuffle, autoPlay, (times && parseInt(times)) || undefined);
  }
}
