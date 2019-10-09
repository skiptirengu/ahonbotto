# アホンボット (Ahonbotto)

Yet another discord bot.  
This bot is generic enough for you to use on any discord server.

### RUNNING THE BOT

1. Clone this repo `git clone https://github.com/skiptirengu/ahonbotto`
2. Install the packages `yarn install`
3. Create a `.env` file in the root directory and place your tokens there
```env
DISCORD_TOKEN=my_super_secret_discord_token
YOUTUBE_TOKEN=my_super_secret_youtube_token
COMMAND_PREFIXES=$,% // comma separeted command prefixes, this means you can't use comma as a command prefix :p
```
4. Start the bot with `yarn start`

The bot logs can be found on the `runtime/logs` directory.

### FAQ

**Q:** _Why another discord bot?_  
**A:** Why not?

**Q:** _What does this do?_  
**A:** It has a optimized, resilient and brainlet proof audio streaming system, allowing url queueing, youtube playlists and youtube api searching (for the latter you need to create a YouTube api token). It also has some other text commands (see !help for a complete list).

**Q:** _Can I copy, share, sell, tell my friends I programmed this bot, give it as a birthday present to my grandma, etc?_  
**A:** Yes, you can [Do What The F*ck You Want](LICENSE) with it.
