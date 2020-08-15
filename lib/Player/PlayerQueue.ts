import { EventEmitter } from 'events';
import { scoped } from 'tsyringe';
import { Lifecycle } from 'tsyringe';

import { Playable } from './Playable';

/**
 * @event PlayerQueue#playable
 */

@scoped(Lifecycle.ContainerScoped)
export class PlayerQueue extends EventEmitter {
  /**
   * Music queue
   */
  protected readonly stack: Playable[];

  public constructor() {
    super();
    this.stack = [];
  }

  /**
   * Clears the entire queue
   */
  public clear(): void {
    this.stack.splice(0);
  }

  /**
   * Pushes a playable to the queue
   */
  public push(playable: Playable): void {
    this.stack.push(playable);

    if (this.stack.length === 1) {
      this.emit('playable');
    }
  }

  /**
   * Whether the queue is empty
   */
  public empty(): boolean {
    return this.stack.length === 0;
  }

  /**
   * Returns the next playable in queue
   */
  public shift(): Playable | undefined {
    return this.stack.shift();
  }
}
