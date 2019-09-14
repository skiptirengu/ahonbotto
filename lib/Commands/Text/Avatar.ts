import { CommandDefinition, CommandType, Command } from '..'
import { Message, MessageEmbed, ImageSize, User, MessageEmbedOptions } from 'discord.js'
import { withCommandPrefix } from '../../Util'
import { scoped } from 'tsyringex'

interface UserAvatar {
  user: User
  urls: string[]
}

@scoped('CommandDefinition')
export class Definition implements CommandDefinition {
  /**
   * @inheritdoc
   */
  type = CommandType.Text
  /**
   * @inheritdoc
   */
  command = 'Avatar'
  /**
   * @inheritdoc
   */
  public usage(): MessageEmbedOptions {
    return {
      title: '<mention>',
      description:
        'Show someone\'s avatar. If "**mention**" is not defined, show the user\'s profile picture.',
      fields: [
        {
          name: 'Example:',
          value: `\`${withCommandPrefix('avatar')} @Someone#2469\``,
          inline: true
        }
      ]
    }
  }
}

@scoped('Avatar')
export class Avatar implements Command {
  /**
   * Avatar sizes
   */
  private readonly sizes: ImageSize[] = [256, 1024, 2048]

  /**
   * @param message
   */
  private getUserAvatar(message: Message): UserAvatar {
    const mentions = message.mentions.members
    const user = (mentions && mentions.size > 0 && mentions.first()!.user) || message.member!.user

    const urls = this.sizes.map(
      (size) => `- Size [${size} x ${size}](${user.displayAvatarURL({ size })})`
    )

    return { user: user, urls }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: Message, params: string[]): Promise<Message | Message[]> {
    const userAvatar = this.getUserAvatar(message)

    const embed = new MessageEmbed({
      description: userAvatar.urls.join('\n'),
      image: {
        url: userAvatar.user.displayAvatarURL({ size: 1024 })
      }
    })

    return message.channel.send(embed)
  }
}
