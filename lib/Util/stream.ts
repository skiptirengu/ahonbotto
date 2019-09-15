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

export const once = (callback: streamCallback): streamCallback => {
  let handled = false
  return () => {
    if (!handled) {
      callback()
      handled = true
    }
  }
}
