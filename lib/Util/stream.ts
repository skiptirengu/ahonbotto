import { Readable } from 'stream'

export const handleStreamError = (
  stream: Readable,
  ...callbacks: Function[]
): ((...args: any[]) => void) => {
  return () => {
    try {
      callbacks.forEach((callback) => callback())
    } catch (err) {
      stream.emit('error', err)
    }
  }
}
