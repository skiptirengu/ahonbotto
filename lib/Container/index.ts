import { container, DependencyContainer } from 'tsyringex'
import { Command, CommandDefinition } from '../Commands'
import { Client } from 'discord.js'
import { Config } from '../Config'

import { About as AboutCommand, definition as aboutDefinition } from '../Commands/Text/About'
import { Avatar as AvatarCommand, definition as avatarDefinition } from '../Commands/Text/Avatar'
import { Help as HelpCommand, definition as helpDefinition } from '../Commands/Text/Help'
import { Karen as KarenCommand, definition as karenDefinition } from '../Commands/Text/Karen'
import { Usage as UsageCommand, definition as usageDefinition } from '../Commands/Text/Usage'

const scopeMap = new Map<string, DependencyContainer>()

export { container }

export function bootstrap(client: Client): void {
  // register config object
  container.register<Config>('Config', {
    useValue: {
      discordToken: process.env['discordToken'] as string,
      youtubeToken: process.env['youtubeToken'] as string,
      commandPrefixes: ['$']
    }
  })
  // register client
  container.register(Client, { useValue: client })
  // Bind commands
  bindTextCommands()
}

export function scopeFactory(name: string): DependencyContainer {
  return (
    (scopeMap.has(name) && scopeMap.get(name)!) ||
    scopeMap.set(name, container.createScope()).get(name)!
  )
}

function bindTextCommands(): void {
  registerCommand(HelpCommand, helpDefinition)
  registerCommand(AvatarCommand, avatarDefinition)
  registerCommand(UsageCommand, usageDefinition)
  registerCommand(KarenCommand, karenDefinition)
  registerCommand(AboutCommand, aboutDefinition)
}

function registerCommand(command: any, value: CommandDefinition): void {
  container.register<CommandDefinition>('CommandDefinition', { useValue: value })
  container.registerScoped<Command>(value.command, command)
}
