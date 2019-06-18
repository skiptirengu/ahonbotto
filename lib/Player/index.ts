import { injectable } from 'tsyringex'
import { VoiceChannel, VoiceConnection } from 'discord.js'

@injectable()
export class Player {
  /**
   * The voice channel the bot is currently connected to
   */
  public voiceChannel?: VoiceChannel
  /**
   * The current voice connection the bot is streaming to
   */
  public voiceConnection?: VoiceConnection
}
