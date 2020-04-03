import { Message, MessageEmbedOptions } from 'discord.js'
import { pathExists } from 'fs-extra'
import { toNumber } from 'lodash'
import { join } from 'path'
import { URL } from 'url'

import { Config } from '../Config'
import { Playable } from '../Player/Playable'
import { Player } from '../Player/Player'
import { Command, CommandDefinition, CommandType } from './Command'

const audioFolder = 'audio'

export abstract class AudioFileCommandDefinition implements CommandDefinition {
  /**
   * Filename to use on the command description
   */
  abstract file: string
  /**
   * @inheritdoc
   */
  abstract command: string
  /**
   * @inheritdoc
   */
  type = CommandType.Voice
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      title: '[<volume>]',
      description: `Play the file "${this.file}" with the volume set to value of "**volume**".`,
    }
  }
}

export abstract class AudioFileCommand implements Command {
  /**
   * Filename containg the OPUS file
   */
  protected abstract readonly filename: string
  /**
   * User friendly name
   */
  protected abstract readonly name: string

  public constructor(
    /**
     * Bot configuration
     */
    protected readonly config: Config,
    /**
     * Player instance
     */
    protected readonly player: Player
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(message: Message, params: string[]): Promise<void> {
    await message.delete()

    if (!message.member || !message.member.voice || !message.member.voice.channel) return

    const path = join(this.config.resourcesFolder, audioFolder, this.filename)

    if (!(await pathExists(path))) {
      throw new Error(`File ${this.filename} does not exist in resources folder`)
    }

    let volume = toNumber(params.shift()) || undefined
    if (volume && volume > 100) {
      volume = 100
    }

    const uri = new URL(`file://${path}`)
    const playable: Playable = { isLocal: true, name: this.name, uri, volume }

    this.player.push(message.member.voice.channel, playable, 1)
  }
}
