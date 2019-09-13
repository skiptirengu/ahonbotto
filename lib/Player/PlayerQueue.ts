import { Playable } from './Playable'
import { EventEmitter } from 'events'
import { scoped } from 'tsyringex'

/**
 * @event PlayerQueue#playable
 */
@scoped()
export class PlayerQueue extends EventEmitter {
  /**
   * Music queue
   */
  protected readonly stack: Playable[]

  public constructor() {
    super()
    this.stack = []
  }

  /**
   * Pushes a playable to the queue
   */
  public push(playable: Playable): void {
    this.stack.push(playable)

    if (this.stack.length === 1) {
      this.emit('playable')
    }
  }

  /**
   * Returns the next playable in queue
   */
  public pop(): Playable | undefined {
    return this.stack.pop()
  }
}
