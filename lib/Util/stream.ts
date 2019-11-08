import { EventEmitter } from 'events'
import { Readable } from 'stream'

export type streamCallback = (...args: any[]) => void

export const handleStreamError = (stream: Readable, ...callbacks: Function[]): streamCallback => {
  return () => {
    try {
      callbacks.forEach((callback) => callback())
    } catch (err) {
      stream.emit('error', err)
    }
  }
}

/**
 * Ensures the callback is executed only once
 * @param callback
 */
export const once = (callback: streamCallback): streamCallback => {
  let handled = false
  return () => {
    if (!handled) {
      callback()
      handled = true
    }
  }
}

/**
 * Ensures only one of the events executes the event handler once
 */
export const anyOnce = <T extends EventEmitter>(
  stream: T,
  events: string[],
  callback: streamCallback
): T => {
  const handler = once(() => {
    events.forEach((event) => stream.removeListener(event, handler))
    callback()
  })
  events.forEach((event) => stream.once(event, handler))
  return stream
}
