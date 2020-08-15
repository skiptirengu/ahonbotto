import { EventEmitter } from 'events';
import { singleton } from 'tsyringe';

import { getScopes } from '../Container';
import { anyOnce } from '../Util';
import { Player } from './Player';

@singleton()
export class PlayerCleanup {
  /**
   * Attaches the cleanup event to the given event emitter
   * @param emitter The event emitter (the process object)
   */
  public attatch(emitter: EventEmitter): void {
    anyOnce(emitter, ['SIGINT', 'uncaughtException'], () => this.cleanup());
  }

  /**
   * Stops all players
   */
  public cleanup(): void {
    const scopes = getScopes();

    for (const [, scope] of scopes) {
      const player = scope.resolve(Player);
      player.stop();
    }
  }
}
