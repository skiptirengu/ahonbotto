import { container } from '../Container'
import { Config } from '../Config'
import { first } from 'lodash'
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

export const withCommandPrefix = (value: string): string => {
  return (first(getConfig().commandPrefixes) || '').concat(value)
}

export const getConfig = (): Config => container.resolve<Config>('Config')
