import { container } from '../Container'
import { Config } from '../Config'
import { first } from 'lodash'

export const withCommandPrefix = (value: string): string => {
  return (first(getConfig().commandPrefixes) || '').concat(value)
}

export const getConfig = (): Config => container.resolve<Config>('Config')
