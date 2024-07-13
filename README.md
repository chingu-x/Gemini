# pair-prog-bot

#### pair-prog-bot is a discord bot made for Chingu
___

#### How to run
* `npm install` to install the dependencies 
* You also need to set your bot token in a `.env` file, and pass it in through the `token` variable

* `node index.js` to run the bot

* When new commands are added, run `node deploy-commands.js.` This will update the server with the new changes. Only needed regarding commands.

#### Dependencies
* discord.js - 14.14.1
* dotenv - 16.3.1

#### .env
Your .env should contain the following:
* `DISCORD_TOKEN = <your-discord-token>`
* `CLIENT_ID = <your-client-id>`
* `GUILD_ID = <your-server-id>`

Token and Client ID can be found in the [Discord Developer Portal](https://discord.com/developers/)

### Development
#### Branch naming
* lowercase and hyphen inplace of space. For example `feature/discord-bot`
* Only alphanumeric characters, dont use period, space, underscores etc. and dont use multiple hyphens after another, or trailing hyphens.

1. `feature/` for all features. Example `feature/matching-system`
2. `bugfix/` for all bugfixes. Example `bugfix/matchmaking-system`
3. `hotfix/` for all quick emergency fixes. Example `hotfix/critical-matchmaking-error`
4. `doc/` for udates to our documentation. Example `doc/bot-commands`
5. `refactor/` for refactoring.

#### Commit messages
* all commit messages should be short (50 characters or less), but descriptive. Example `feat: added `
* We use the following prefixes:
  * `feat:` for features
  * `fix:` for bugfixes and hotfixes
  * `doc:` for ducumentaion
  * `refactor:` for refactoring